const { SQLProvider, Type, Schema, QueryBuilder, util: { mergeDefault, isNumber } } = require('klasa');
const { Pool } = require('pg');

module.exports = class PostgreSQL extends SQLProvider {

	constructor(...args) {
		super(...args);
		this.qb = new QueryBuilder({
			boolean: { type: 'BOOL' },
			integer: { type: ({ max }) => max >= 2 ** 32 ? 'BIGINT' : 'INTEGER' },
			float: { type: 'DOUBLE PRECISION' },
			uuid: { type: 'UUID' },
			json: { type: 'JSON', resolver: (input, { array }) => array ? input.map(value => `'${JSON.stringify(value)}'::json`) : `'${JSON.stringify(input)}'::json` },
			any: { type: 'JSON', resolver: (input, { array }) => array ? input.map(value => `'${JSON.stringify(value)}'::json`) : `'${JSON.stringify(input)}'::json` }
		}, {
			array: type => `${type}[]`,
			formatDatatype: (name, datatype, def = null) => `"${name}" ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`
		});
		this.db = null;
	}

	async init() {
		const connection = mergeDefault({
			host: 'localhost',
			port: 5432,
			db: 'klasa',
			options: {
				max: 20,
				idleTimeoutMillis: 30000,
				connectionTimeoutMillis: 2000
			}
		}, this.client.options.providers.postgresql);
		this.db = new Pool(Object.assign({
			host: connection.host,
			port: connection.port,
			user: connection.user,
			password: connection.password,
			database: connection.db
		}, connection.options));

		this.db.on('error', err => this.client.emit('error', err));
		await this.db.connect();
	}

	shutdown() {
		return this.db.end();
	}

	/* Table methods */

	/**
	 * @param {string} table Check if a table exists
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.runAll(`SELECT true FROM pg_tables WHERE tablename = '${table}';`)
			.then(result => result.length !== 0 && result[0].bool === true)
			.catch(() => false);
	}

	/**
	 * @param {string} table The name of the table to create
	 * @param {Array<Iterable>} [rows] The rows with their respective datatypes
	 * @returns {Promise<Object[]>}
	 */
	createTable(table, rows) {
		if (rows) return this.run(`CREATE TABLE ${sanitizeKeyName(table)} (${rows.map(([k, v]) => `${sanitizeKeyName(k)} ${v}`).join(', ')});`);
		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);
		return this.run(`CREATE TABLE ${sanitizeKeyName(table)} (${[...gateway.schema.values(true)].map(this.qb.parse.bind(this.qb))})`);
	}

	/**
	 * @param {string} table The name of the table to drop
	 * @returns {Promise<Object[]>}
	 */
	deleteTable(table) {
		return this.run(`DROP TABLE IF EXISTS ${sanitizeKeyName(table)};`);
	}

	/**
	 * @param {string} table The table with the rows to count
	 * @returns {Promise<number>}
	 */
	countRows(table) {
		return this.runOne(`SELECT COUNT(*) FROM ${sanitizeKeyName(table)};`)
			.then(result => Number(result.count));
	}

	/* Row methods */

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} [key] The key to filter the data from. Requires the value parameter
	 * @param {*}    [value] The value to filter the data from. Requires the key parameter
	 * @param {number} [limitMin] The minimum range. Must be higher than zero
	 * @param {number} [limitMax] The maximum range. Must be higher than the limitMin parameter
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, key, value, limitMin, limitMax) {
		if (typeof key !== 'undefined' && typeof value !== 'undefined') {
			return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = $1 ${parseRange(limitMin, limitMax)};`, [value])
				.then(results => results.map(this.parseEntry.bind(this)));
		}

		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} ${parseRange(limitMin, limitMax)};`)
			.then(results => results.map(this.parseEntry.bind(this)));
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
	 * @param {*}    [value] The value of the filtered key
	 * @returns {Promise<Object>}
	 */
	get(table, key, value) {
		// If a key is given (id), swap it and search by id - value
		if (typeof value === 'undefined') {
			value = key;
			key = 'id';
		}
		return this.runOne(`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = $1 LIMIT 1;`, [value]).then(this.parseEntry.bind(this));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} id    The value of the id
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.runOne(`SELECT id FROM ${sanitizeKeyName(table)} WHERE id = $1 LIMIT 1;`, [id])
			.then(result => Boolean(result));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.runOne(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY RANDOM() LIMIT 1;`);
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
			throw new TypeError(`PostgreSQL#getSorted 'order' parameter expects either 'DESC' or 'ASC'. Got: ${order}`);
		}

		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY ${sanitizeKeyName(key)} ${order} ${parseRange(limitMin, limitMax)};`);
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
		keys.push('id');
		values.push(id);
		return this.run(`
			INSERT INTO ${sanitizeKeyName(table)} (${keys.map(sanitizeKeyName).join(', ')})
			VALUES (${Array.from({ length: 9 }, (__, i) => `$${i + 1}`).join(', ')});`, values);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} data The data to update
	 * @returns {Promise<any[]>}
	 */
	update(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);
		return this.run(`
			UPDATE ${sanitizeKeyName(table)}
			SET ${keys.map((key, i) => `${sanitizeKeyName(key)} = $${i + 1}`)}
			WHERE id = '${id.replace(/'/, "''")}';`, values);
	}

	/**
	 * @param {...*} args The arguments
	 * @alias PostgreSQL#update
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
			throw new TypeError(`PostgreSQL#incrementValue expects the parameter 'amount' to be an integer greater or equal than zero. Got: ${amount}`);
		}

		return this.run(`UPDATE ${sanitizeKeyName(table)} SET $2 = $2 + $3 WHERE id = $1;`, [id, key, amount]);
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
			throw new TypeError(`PostgreSQL#decrementValue expects the parameter 'amount' to be an integer greater or equal than zero. Got: ${amount}`);
		}

		return this.run(`UPDATE ${sanitizeKeyName(table)} SET $2 = GREATEST(0, $2 - $3) WHERE id = $1;`, [id, key, amount]);
	}

	/**
	 * @param {string} table The name of the table to update
	 * @param {string} id The id of the row to delete
	 * @returns {Promise<any[]>}
	 */
	delete(table, id) {
		return this.run(`DELETE FROM ${sanitizeKeyName(table)} WHERE id = $1;`, [id]);
	}

	/**
	 * Add a new column to a table's schema.
	 * @param {string} table The table to check against
	 * @param {(SchemaFolder | SchemaPiece)} piece The SchemaFolder or SchemaPiece added to the schema
	 * @returns {Promise<*>}
	 */
	addColumn(table, piece) {
		if (!(piece instanceof Schema)) throw new TypeError('Invalid usage of PostgreSQL#addColumn. Expected a SchemaPiece or SchemaFolder instance.');
		return this.run(piece.type !== 'Folder' ?
			`ALTER TABLE ${sanitizeKeyName(table)} ADD COLUMN ${this.qb.parse(piece)};` :
			`ALTER TABLE ${sanitizeKeyName(table)} ${[...piece.values(true)].map(subpiece => `ADD COLUMN ${this.qb.parse(subpiece)}`).join(', ')}`);
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The table to check against
	 * @param {(string|string[])} columns The column names to remove
	 * @returns {Promise<*>}
	 */
	removeColumn(table, columns) {
		if (typeof columns === 'string') return this.run(`ALTER TABLE ${sanitizeKeyName(table)} DROP COLUMN ${sanitizeKeyName(columns)};`);
		if (Array.isArray(columns)) return this.run(`ALTER TABLE ${sanitizeKeyName(table)} DROP ${columns.map(sanitizeKeyName).join(', ')};`);
		throw new TypeError('Invalid usage of PostgreSQL#removeColumn. Expected a string or string[].');
	}

	/**
	 * Alters the datatype from a column.
	 * @param {string} table The table to check against
	 * @param {SchemaPiece} piece The modified SchemaPiece
	 * @returns {Promise<*>}
	 */
	updateColumn(table, piece) {
		const [column, ...datatype] = this.qb.parse(piece).split(' ');
		return this.run(`ALTER TABLE ${sanitizeKeyName(table)} ALTER ${sanitizeKeyName(column)} TYPE ${datatype};`);
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {...any} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(...sql) {
		return this.db.query(...sql)
			.then(result => result);
	}

	/**
	 * Get all entries from a table.
	 * @param {...any} sql The query to execute.
	 * @returns {Promise<any[]>}
	 */
	runAll(...sql) {
		return this.run(...sql)
			.then(result => result.rows);
	}

	/**
	 * Get one entry from a table.
	 * @param {...any} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runOne(...sql) {
		return this.run(...sql)
			.then(result => result.rows[0]);
	}

};

/**
 * @param {string} value The string to sanitize as a key
 * @returns {string}
 * @private
 */
function sanitizeKeyName(value) {
	if (typeof value !== 'string') throw new TypeError(`[SANITIZE_NAME] Expected a string, got: ${new Type(value)}`);
	if (/`|"/.test(value)) throw new TypeError(`Invalid input (${value}).`);
	if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') return value;
	return `"${value}"`;
}

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
		throw new TypeError(`[PARSE_RANGE] 'min' parameter expects an integer or undefined, got ${min}`);
	}
	if (min < 0) {
		throw new RangeError(`[PARSE_RANGE] 'min' parameter expects to be equal or greater than zero, got ${min}`);
	}

	// Max value validation
	if (typeof max !== 'undefined') {
		if (!isNumber(max)) {
			throw new TypeError(`[PARSE_RANGE] 'max' parameter expects an integer or undefined, got ${max}`);
		}
		if (max <= min) {
			throw new RangeError(`[PARSE_RANGE] 'max' parameter expects ${max} to be greater than ${min}. Got: ${max} <= ${min}`);
		}
	}

	return `LIMIT ${min}${typeof max === 'number' ? `,${max}` : ''}`;
}
