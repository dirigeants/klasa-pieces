const { SQLProvider, QueryBuilder, Schema, Timestamp, Type, util: { mergeDefault, isNumber, isObject } } = require('klasa');

/**
 * NOTE: You need to install mysql2
 * https://www.npmjs.com/package/mysql2
 *
 * The library has a folder called promise, which we're accessing
 */
const mysql = require('mysql2/promise');

const TIMEPARSERS = {
	DATE: new Timestamp('YYYY-MM-DD'),
	DATETIME: new Timestamp('YYYY-MM-DD hh:mm:ss')
};

module.exports = class extends SQLProvider {

	constructor(...args) {
		super(...args);
		this.qb = new QueryBuilder({
			any: { type: 'JSON', resolver: (input) => sanitizeObject(input) },
			boolean: { type: 'BIT(1)', resolver: (input) => input ? '1' : '0' },
			date: { type: 'DATETIME', resolver: (input) => TIMEPARSERS.DATETIME.display(input) },
			float: 'DOUBLE PRECISION',
			integer: ({ max }) => max >= 2 ** 32 ? 'BIGINT' : 'INTEGER',
			json: { type: 'JSON', resolver: (input) => sanitizeObject(input) },
			null: 'NULL',
			time: { type: 'DATETIME', resolver: (input) => TIMEPARSERS.DATETIME.display(input) },
			timestamp: { type: 'TIMESTAMP', resolver: (input) => TIMEPARSERS.DATE.display(input) },
			array: () => 'ARRAY',
			arrayResolver: (values) => values.length ? sanitizeObject(values) : "'[]'",
			formatDatatype: (name, datatype, def = null) => datatype === 'ARRAY' ?
				`${sanitizeKeyName(name)} TEXT` :
				`${sanitizeKeyName(name)} ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`
		});
		this.db = null;
	}

	async init() {
		const connection = mergeDefault({
			host: 'localhost',
			port: 3306,
			user: 'root',
			password: '',
			db: 'klasa'
		}, this.client.options.providers.mysql);
		this.db = await mysql.createConnection({
			host: connection.host,
			port: connection.port.toString(),
			user: connection.user,
			password: connection.password,
			database: connection.db
		});
		this.heartBeatInterval = setInterval(() => {
			this.db.query('SELECT 1=1')
				.catch(error => this.client.emit('error', error));
		}, 10000);
	}

	/* Table methods */

	/**
	 * @param {string} table Check if a table exists
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.run(`SHOW TABLES LIKE '${table}';`)
			.then(result => !!result)
			.catch(() => false);
	}

	/**
	 * @param {string} table The name of the table to create
	 * @param {Array<Iterable>} rows The rows with their respective datatypes
	 * @returns {Promise<Object[]>}
	 */
	createTable(table, rows) {
		if (rows) return this.runAll(`CREATE TABLE ${sanitizeKeyName(table)} (${rows});`);

		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);

		const schemaValues = [...gateway.schema.values(true)];
		return this.run(`
			CREATE TABLE ${sanitizeKeyName(table)} (
				id VARCHAR(18) NOT NULL UNIQUE${schemaValues.length ? `, ${schemaValues.map(this.qb.parse.bind(this.qb)).join(', ')}` : ''},
				PRIMARY KEY(id)
			)`
		);
	}

	/**
	 * @param {string} table The name of the table to drop
	 * @returns {Promise<Object[]>}
	 */
	deleteTable(table) {
		return this.exec(`DROP TABLE ${sanitizeKeyName(table)};`);
	}

	/**
	 * @param {string} table The table with the rows to count
	 * @returns {Promise<number>}
	 */
	countRows(table) {
		return this.run(`SELECT COUNT(*) FROM ${sanitizeKeyName(table)};`)
			.then(result => result['COUNT(*)']);
	}

	/* Row methods */

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {array} [entries] Filter the query by getting only the data which is present in the database
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, entries = []) {
		if (entries.length) {
			return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} WHERE id IN (${entries.join(',')});`)
				.then(results => results.map(output => this.parseEntry(table, output)));
		}
		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)};`)
			.then(results => results.map(output => this.parseEntry(table, output)));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object[]>}
	 */
	getKeys(table) {
		return this.runAll(`SELECT id FROM ${sanitizeKeyName(table)};`)
			.then(rows => rows.map(row => row.id));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} key The key to filter the data from
	 * @param {*} [value] The value of the filtered key
	 * @returns {Promise<Object>}
	 */
	get(table, key, value) {
		// If a key is given (id), swap it and search by id - value
		if (typeof value === 'undefined') {
			value = key;
			key = 'id';
		}
		return this.run(`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = ${sanitizeInput(value)} LIMIT 1;`)
			.then(result => this.parseEntry(table, result));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} id The value of the id
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.run(`SELECT id FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeString(id)} LIMIT 1;`)
			.then(Boolean);
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.run(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY RAND() LIMIT 1;`)
			.then(result => this.parseEntry(table, result));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} key The key to sort by
	 * @param {('ASC'|'DESC')} [order='DESC'] Whether the order should be ascendent or descendent
	 * @param {number} [limitMin] The minimum range
	 * @param {number} [limitMax] The maximum range
	 * @returns {Promise<Object[]>}
	 */
	async getSorted(table, key, order = 'DESC', limitMin, limitMax) {
		if (order !== 'DESC' && order !== 'ASC') {
			throw new TypeError(`MySQL#getSorted 'order' parameter expects either 'DESC' or 'ASC'. Got: ${order}`);
		}

		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY ${sanitizeKeyName(key)} ${order} ${parseRange(limitMin, limitMax)};`)
			.then(results => results.map(output => this.parseEntry(table, output)));
	}

	/**
	 * @param {string} table The name of the table to insert the new data
	 * @param {string} id The id of the new row to insert
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} data The data to update
	 * @returns {Promise<any[]>}
	 */
	create(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);

		// Push the id to the inserts.
		if (!keys.includes('id')) {
			keys.push('id');
			values.push(id);
		}
		return this.exec(`INSERT INTO ${sanitizeKeyName(table)} (${keys.map(sanitizeKeyName).join(', ')}) VALUES (${values.map(sanitizeInput).join(', ')});`);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} data The data to update
	 * @returns {Promise<any[]>}
	 */
	update(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);
		const update = new Array(keys.length);
		for (let i = 0; i < keys.length; i++) update[i] = `${sanitizeKeyName(keys[i])} = ${sanitizeInput(values[i])}`;

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${update.join(', ')} WHERE id = ${sanitizeString(id)};`);
	}

	/**
	 * @param {...*} args The arguments
	 * @alias MSSQL#update
	 * @returns {Promise<any[]>}
	 */
	replace(...args) {
		return this.update(...args);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {string} key The key to update
	 * @param {number} [amount=1] The value to increase
	 * @returns {Promise<any[]>}
	 */
	incrementValue(table, id, key, amount = 1) {
		if (amount < 0 || !isNumber(amount)) {
			throw new TypeError(`MySQL#incrementValue expects the parameter 'amount' to be an integer greater or equal than zero. Got: ${amount}`);
		}

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${key} = ${key} + ${amount} WHERE id = ${sanitizeString(id)};`);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {string} key The key to update
	 * @param {number} [amount=1] The value to decrease
	 * @returns {Promise<any[]>}
	 */
	decrementValue(table, id, key, amount = 1) {
		if (amount < 0 || !isNumber(amount)) {
			throw new TypeError(`MySQL#incrementValue expects the parameter 'amount' to be an integer greater or equal than zero. Got: ${amount}`);
		}

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${key} = GREATEST(0, ${key} - ${amount}) WHERE id = ${sanitizeString(id)};`);
	}

	/**
	 * @param {string} table The name of the table to update
	 * @param {string} id The id of the row to delete
	 * @returns {Promise<any[]>}
	 */
	delete(table, id) {
		return this.exec(`DELETE FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeString(id)};`);
	}

	/**
	 * Add a new column to a table's schema.
	 * @param {string} table The table to update
	 * @param {(SchemaFolder | SchemaPiece)} piece The SchemaFolder or SchemaPiece added to the schema
	 * @returns {Promise<*>}
	 */
	addColumn(table, piece) {
		if (!(piece instanceof Schema)) throw new TypeError('Invalid usage of PostgreSQL#addColumn. Expected a SchemaPiece or SchemaFolder instance.');
		return this.exec(piece.type !== 'Folder' ?
			`ALTER TABLE ${sanitizeKeyName(table)} ADD COLUMN ${this.qb.parse(piece)};` :
			`ALTER TABLE ${sanitizeKeyName(table)} ${[...piece.values(true)].map(subpiece => `ADD COLUMN ${this.qb.parse(subpiece)}`).join(', ')};`);
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {(string|string[])} key The key to remove.
	 * @returns {Promise<any[]>}
	 */
	removeColumn(table, key) {
		if (typeof key === 'string') return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} DROP COLUMN ${sanitizeKeyName(key)};`);
		if (Array.isArray(key)) return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} DROP ${key.map(sanitizeKeyName).join(', ')};`);
		throw new TypeError('Invalid usage of MySQL#removeColumn. Expected a string or string[].');
	}

	/**
	 * Alters the datatype from a column.
	 * @param {string} table The table to update
	 * @param {SchemaPiece} piece The modified SchemaPiece
	 * @returns {Promise<*>}
	 */
	updateColumn(table, piece) {
		const [column, ...datatype] = this.qb.parse(piece).split(' ');
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} MODIFY COLUMN ${sanitizeKeyName(column)} TYPE ${datatype};`);
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(sql) {
		return this.db.query(sql)
			.then(([rows]) => rows[0]);
	}

	/**
	 * Get all rows from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object[]>}
	 */
	runAll(sql) {
		return this.db.query(sql)
			.then(([rows]) => rows);
	}

	/**
	 *
	 * @param {string} sql The query to execute
	 * @returns {Promise<Object[]>}
	 */
	exec(sql) {
		return this.db.query(sql);
	}

};

/**
 * @param {number} [min] The minimum value
 * @param {number} [max] The maximum value
 * @returns {string}
 * @private
 */
function parseRange(min, max) {
	// Min value validation
	if (typeof min === 'undefined') return '';
	if (!isNumber(min)) {
		throw new TypeError(`%MySQL.parseRange 'min' parameter expects an integer or undefined, got ${min}`);
	}

	if (min < 0) {
		throw new TypeError(`%MySQL.parseRange 'min' parameter expects to be equal or greater than zero, got ${min}`);
	}

	// Max value validation
	if (typeof max !== 'undefined') {
		if (!isNumber(max)) {
			throw new TypeError(`%MySQL.parseRange 'max' parameter expects an integer or undefined, got ${max}`);
		}

		if (max <= min) {
			throw new TypeError(`%MySQL.parseRange 'max' parameter expects ${max} to be greater than ${min}. Got: ${max} <= ${min}`);
		}
	}

	return `LIMIT ${min}${typeof max === 'number' ? `,${max}` : ''}`;
}

/**
 * @param {number} value The number to sanitize
 * @returns {string}
 * @private
 */
function sanitizeInteger(value) {
	if (!isNumber(value)) throw new TypeError(`%MySQL.sanitizeNumber expects an integer, got ${value}`);
	if (value < 0) throw new TypeError(`%MySQL.sanitizeNumber expects a positive integer, got ${value}`);
	return String(value);
}

/**
 * @param {string} value The string to sanitize
 * @returns {string}
 * @private
 */
function sanitizeString(value) {
	return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * @param {string} value The string to sanitize as a key
 * @returns {string}
 * @private
 */
function sanitizeKeyName(value) {
	if (typeof value !== 'string') throw new TypeError(`%MySQL.sanitizeString expects a string, got: ${new Type(value)}`);
	if (/`/.test(value)) throw new TypeError(`Invalid input (${value}).`);
	return `\`${value}\``;
}

/**
 * @param {Object} value The object to sanitize
 * @returns {string}
 * @private
 */
function sanitizeObject(value) {
	if (value === null) return 'NULL';
	if (Array.isArray(value) || isObject(value)) return sanitizeString(JSON.stringify(value));
	throw new TypeError(`%MySQL.sanitizeObject expects NULL, an array, or an object. Got: ${new Type(value)}`);
}

/**
 * @param {boolean} value The boolean to sanitize
 * @returns {number}
 * @private
 */
function sanitizeBoolean(value) {
	return value ? 1 : 0;
}

/**
 *
 * @param {*} value The value to sanitize
 * @returns {string}
 * @private
 */
function sanitizeInput(value) {
	switch (typeof value) {
		case 'string': return sanitizeString(value);
		case 'number': return sanitizeInteger(value);
		case 'object': return sanitizeObject(value);
		case 'boolean': return sanitizeBoolean(value);
		default: throw new TypeError(`%MySQL.sanitizeInput expects type of string, number, or object. Got: ${new Type(value)}`);
	}
}
