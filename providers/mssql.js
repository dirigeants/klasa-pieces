/**
 * #####################################
 * #              UNTESTED             #
 * # THIS PROVIDER MAY OR MAY NOT WORK #
 * #####################################
 */

const { SQLProvider, QueryBuilder, Timestamp, Type, util: { mergeDefault, isNumber } } = require('klasa');
const mssql = require('mssql');

const TIMEPARSERS = {
	DATE: new Timestamp('YYYY-MM-DD'),
	DATETIME: new Timestamp('YYYY-MM-DD hh:mm:ss')
};

module.exports = class extends SQLProvider {

	constructor(...args) {
		super(...args);
		this.qb = new QueryBuilder({
			integer: ({ max }) => max >= 2 ** 32 ? 'BIGINT' : 'INTEGER',
			float: 'REAL',
			date: { type: 'DATETIME', resolver: (input) => TIMEPARSERS.DATETIME.display(input) },
			time: { type: 'DATETIME', resolver: (input) => TIMEPARSERS.DATETIME.display(input) },
			timestamp: { type: 'TIMESTAMP', resolver: (input) => TIMEPARSERS.DATE.display(input) },
			array: type => type,
			arrayResolver: (values) => `'${sanitizeString(JSON.stringify(values))}'`,
			formatDatatype: (name, datatype, def = null) => `\`${name}\` ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`
		});
		this.pool = null;
	}

	async init() {
		const connection = mergeDefault({
			host: 'localhost',
			db: 'klasa',
			user: 'database-user',
			password: 'database-password',
			options: { encrypt: false }
		}, this.client.options.providers.mssql);
		this.pool = new mssql.ConnectionPool({
			user: connection.user,
			password: connection.password,
			server: connection.host,
			database: connection.database,
			// If you're on Windows Azure, you will need this enabled:
			options: connection.options
		});

		await this.pool.connect();
	}

	async shutdown() {
		await this.pool.close();
	}

	/**
	 * @returns {Promise<string[]>}
	 */
	getTables() {
		return this.run('SELECT TABLE_NAME, TABLE_SCHEMA FROM INFORMATION_SCHEMA.TABLES;');
	}

	/* Table methods */

	/**
	 * @param {string} table Check if a table exists
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.run(`IF ( EXISTS (
			SELECT *
           	FROM INFORMATION_SCHEMA.TABLES
			WHERE TABLE_NAME = @0
		) )`, [table]);
	}

	/**
	 * @param {string} table The name of the table to create
	 * @param {Array<Iterable>} rows The rows with their respective datatypes
	 * @returns {Promise<Object[]>}
	 */
	createTable(table, rows) {
		if (rows) return this.run(`CREATE TABLE @0 ( ${rows.map(([k, v]) => `${k} ${v}`).join(', ')} );`, [table]);

		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);

		const schemaValues = [...gateway.schema.values(true)];
		return this.run(`
			CREATE TABLE @0 (
				id VARCHAR(18) PRIMARY KEY NOT NULL UNIQUE${schemaValues.length ? `, ${schemaValues.map(this.qb.parse.bind(this.qb)).join(', ')}` : ''}
			)`, [table]
		);
	}

	/**
	 * @param {string} table The name of the table to drop
	 * @returns {Promise<Object[]>}
	 */
	deleteTable(table) {
		return this.run('IF OBJECT_ID(@0, \'U\') IS NOT NULL DROP TABLE @0;', [table]);
	}

	/**
	 * @param {string} table The table with the rows to count
	 * @returns {Promise<number>}
	 */
	countRows(table) {
		return this.run(`SELECT COUNT(*) FROM @0;`, [table]);
	}

	/* Row methods */

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} [key] The key to filter the data from. Requires the value parameter
	 * @param {*} [value] The value to filter the data from. Requires the key parameter
	 * @param {number} [limit] The maximum range. Must be higher than the limitMin parameter
	 * @param {array} [entries] Filter the query by getting only the data which is present in the database
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, key, value, limit, entries = []) {
		if (typeof key !== 'undefined' && typeof value !== 'undefined') {
			return this.run(`SELECT ${parseRange(limit)} * FROM @0 WHERE @1 = @2;`, [table, key, value])
				.then(results => results.map(output => this.parseEntry(table, output)));
		}

		if (entries.length > 0) {
			return this.run(`SELECT ${parseRange(limit)} * FROM @0 WHERE id IN (@1);`, [table, entries.join(',')])
				.then(results => results.map(output => this.parseEntry(table, output)));
		}

		return this.run(`SELECT ${parseRange(limit)} * FROM @0;`, [table])
			.then(results => results.map(output => this.parseEntry(table, output)));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object[]>}
	 */
	getKeys(table) {
		return this.run(`SELECT id FROM @0;`, [table]);
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
		return this.run('SELECT TOP 1 * FROM @0 WHERE @1 = @2;', [table, key, value])
			.then(result => this.parseEntry(table, result));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} id The value of the id
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.run('IF ( EXISTS ( SELECT TOP 1 * FROM @0 WHERE id = @1 ) )', [table, id]);
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.run('SELECT TOP 1 * FROM @0 ORDER BY NEWID();', [table])
			.then(result => this.parseEntry(table, result));
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
		return this.run(`INSERT INTO ${sanitizeKeyName(table)}
			(${keys.map(sanitizeKeyName).join(', ')})
			VALUES (${Array.from({ length: keys.length }, (__, i) => `@${i}`).join(', ')});`, values);
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
			SET ${keys.map((key, i) => `${sanitizeKeyName(key)} = @${i}`)}
			WHERE id = ${sanitizeString(id)};`, values);
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
	 * @param {string} table The name of the table to update
	 * @param {string} id The id of the row to delete
	 * @returns {Promise<any[]>}
	 */
	delete(table, id) {
		return this.run(`
			DELETE *
			FROM @0
			WHERE id = @1;`, [table, id]);
	}

	/**
	 * Add a new column to a table's schema.
	 * @param {string} table The table to check against
	 * @param {(SchemaFolder | SchemaPiece)} piece The SchemaFolder or SchemaPiece added to the schema
	 * @returns {Promise<*>}
	 */
	addColumn(table, piece) {
		return this.run(piece.type !== 'Folder' ?
			`ALTER TABLE ${sanitizeKeyName(table)} ADD ${this.qb.parse(piece)};` :
			`ALTER TABLE ${sanitizeKeyName(table)} ${[...piece.values(true)].map(subpiece => `ADD ${this.qb.parse(subpiece)}`).join(', ')}`);
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {(string|string[])} key The key to remove.
	 * @returns {Promise<any[]>}
	 */
	removeColumn(table, key) {
		if (typeof key === 'string') return this.run(`ALTER TABLE @0 DROP COLUMN @1;`, [table, key]);
		if (Array.isArray(key)) return this.run(`ALTER TABLE @0 DROP ${key.map(sanitizeKeyName).join(', ')};`, [table]);
		throw new TypeError('Invalid usage of MSSQL#removeColumn. Expected a string or string[].');
	}

	/**
	 * Edit the key's datatype from the table's schema.
	 * @param {string} table The table to update
	 * @param {SchemaPiece} piece The modified SchemaPiece
	 * @returns {Promise<any[]>}
	 */
	updateColumn(table, piece) {
		const [column, ...datatype] = this.qb.parse(piece).split(' ');
		return this.run(`
			ALTER TABLE @0
			ALTER COLUMN @1 @2;`, [table, column, datatype]);
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @param {*[]} [inputs] The inputs to insert.
	 * @param {*[]} [outputs] The outputs to insert.
	 * @returns {Promise<Object>}
	 */
	run(sql, inputs, outputs) {
		if (inputs.length > 0) {
			const request = new mssql.Request();
			for (let i = 0; i < inputs.length; i++) request.input(String(i), inputs[i]);
			for (let i = 0; i < outputs.length; i++) request.input(outputs[i]);
			return request.query(sql)
				.then(result => Promise.resolve(result))
				.catch(error => Promise.reject(error));
		}
		return new mssql.Request().query(sql)
			.then(result => Promise.resolve(result))
			.catch(error => Promise.reject(error));
	}

};

/**
 * @param {string} value The string to sanitize
 * @returns {string}
 * @private
 */
function sanitizeString(value) {
	return `'${value.replace(/'/g, "''")}'`;
}

/**
 * @param {string} value The string to sanitize as a key
 * @returns {string}
 * @private
 */
function sanitizeKeyName(value) {
	if (typeof value !== 'string') throw new TypeError(`%MSSQL.sanitizeString expects a string, got: ${new Type(value)}`);
	if (/`/.test(value)) throw new TypeError(`Invalid input (${value}).`);
	return value;
}

/**
 * @param {number} [number] The limit number.
 * @param {boolean} [all] If it should show all.
 * @returns {string}
 * @private
 */
function parseRange(number, all = true) {
	return isNumber(number) ? `TOP ${number}` : all ? 'ALL' : '';
}
