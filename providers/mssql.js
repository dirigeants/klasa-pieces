/**
 * #####################################
 * #              UNTESTED             #
 * # THIS PROVIDER MAY OR MAY NOT WORK #
 * #####################################
 */

const { Provider, util } = require('klasa');
const mssql = require('mssql');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, {
			enabled: true,
			sql: true,
			description: 'Allows you to use MSSQL functionality throught Klasa'
		});
		this.pool = null;
	}

	async init() {
		const connection = util.mergeDefault({
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
           	FROM  INFORMATION_SCHEMA.TABLES
			WHERE TABLE_NAME = @0
		) )`, [table]);
	}

	/**
	 * @param {string} table The name of the table to create
	 * @param {string} rows The rows with their respective datatypes
	 * @returns {Promise<Object[]>}
	 */
	createTable(table, rows) {
		return this.run(`CREATE TABLE @0 ( ${rows} );`, [table]);
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
	 * @param {*}    [value] The value to filter the data from. Requires the key parameter
	 * @param {number} [limit] The maximum range. Must be higher than the limitMin parameter
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, key, value, limit) {
		if (typeof key !== 'undefined' && typeof value !== 'undefined') {
			return this.run(`SELECT ${parseRange(limit)} * FROM @0 WHERE @1 = @2;`, [table, key, value]);
		}

		return this.run(`SELECT ${parseRange(limit)} * FROM @0;`, [table]);
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
	 * @param {*}    [value] The value of the filtered key
	 * @returns {Promise<Object>}
	 */
	get(table, key, value) {
		// If a key is given (id), swap it and search by id - value
		if (typeof value === 'undefined') {
			value = key;
			key = 'id';
		}
		return this.run('SELECT TOP 1 * FROM @0 WHERE @1 = @2;', [table, key, value]);
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} id    The value of the id
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
		return this.run('SELECT TOP 1 * FROM @0 ORDER BY NEWID();', [table]);
	}

	create(table, id, param1, param2) {
		const [keys, values] = acceptArbitraryInput(param1, param2);

		// Push the id to the inserts.
		keys.push('id');
		values.push(id);
		return this.run(`INSERT INTO ${sanitizeKeyName(table)}
			(${keys.map(sanitizeKeyName).join(', ')})
			VALUES (${makeVariables(keys.length)});`, values);
	}

	/**
	 * @param {...*} args The arguments
	 * @alias MSSQL#insert
	 * @returns {Promise<any[]>}
	 */
	set(...args) {
		return this.create(...args);
	}

	/**
	 * @param {...*} args The arguments
	 * @alias MSSQL#insert
	 * @returns {Promise<any[]>}
	 */
	insert(...args) {
		return this.create(...args);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {(string|string[]|{})} param1 The first parameter to validate.
	 * @param {*} [param2] The second parameter to validate.
	 * @returns {Promise<any[]>}
	 */
	update(table, id, param1, param2) {
		const [keys, values] = acceptArbitraryInput(param1, param2);
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
	 * @param {string} table The name of the table to edit.
	 * @param {(string|Array<string[]>)} key The key to add.
	 * @param {string} [datatype] The datatype for the new key.
	 * @returns {Promise<any[]>}
	 */
	addColumn(table, key, datatype) {
		if (typeof key === 'string') return this.run(`ALTER TABLE @0 ADD @1 @2;`, [table, key, datatype]);
		if (typeof datatype === 'undefined' && Array.isArray(key)) {
			return this.run(`ALTER TABLE @0 ${key.map(([column, type]) =>
				`ADD ${sanitizeKeyName(column)} ${type}`).join(', ')};`, [table]);
		}
		throw new TypeError('Invalid usage of MSSQL#addColumn. Expected a string and string or string[][] and undefined.');
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {(string|string[])} key The key to remove.
	 * @returns {Promise<any[]>}
	 */
	removeColumn(table, key) {
		if (typeof key === 'string') {
			return this.run(`
				ALTER TABLE @0
				DROP COLUMN @1;`, [table, key]);
		}
		if (Array.isArray(key)) {
			return this.run(`
				ALTER TABLE @0
				DROP ${key.map(sanitizeKeyName).join(', ')};`, [table]);
		}
		throw new TypeError('Invalid usage of MSSQL#removeColumn. Expected a string or string[].');
	}

	/**
	 * Edit the key's datatype from the table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The name of the column to update.
	 * @param {string} datatype The new datatype for the column.
	 * @returns {Promise<any[]>}
	 */
	updateColumn(table, key, datatype) {
		return this.run(`
			ALTER TABLE @0
			ALTER COLUMN @1 @2;`, [table, key, datatype]);
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
			return request.query(sql);
		}
		return new mssql.Request().query(sql)
			.then(result => result)
			.catch(error => { throw error; });
	}

};

/**
 * Accept any kind of input from two parameters.
 * @param {(string|string[]|{})} param1 The first parameter to validate.
 * @param {*} [param2] The second parameter to validate.
 * @returns {[[], []]}
 * @private
 */
function acceptArbitraryInput(param1, param2) {
	if (typeof param1 === 'undefined' && typeof param2 === 'undefined') return [[], []];
	if (typeof param1 === 'string' && typeof param2 !== 'undefined') return [[param1], [param2]];
	if (Array.isArray(param1) && Array.isArray(param2)) {
		if (param1.length !== param2.length) throw new TypeError(`The array lengths do not match: ${param1.length}-${param2.length}`);
		if (param1.some(value => typeof value !== 'string')) throw new TypeError(`The array of keys must be an array of strings, but found a value that does not match.`);
		return [param1, param2];
	}
	if (util.isObject(param1) && typeof param2 === 'undefined') {
		const entries = [[], []];
		getEntriesFromObject(param1, entries, '');
		return entries;
	}
	throw new TypeError('Invalid input. Expected a key type of string and a value, tuple of arrays, or an object and undefined.');
}

/**
 * Get all entries from an object.
 * @param {Object} object The object to "flatify".
 * @param {[string[], any[]]} param1 The tuple of keys and values to check.
 * @param {string} path The current path.
 * @private
 */
function getEntriesFromObject(object, [keys, values], path) {
	const objectKeys = Object.keys(object);
	for (let i = 0; i < objectKeys.length; i++) {
		const key = objectKeys[i];
		const value = object[key];
		if (util.isObject(value)) {
			getEntriesFromObject(value, [keys, values], path.length > 0 ? `${path}.${key}` : key);
		} else {
			keys.push(path.length > 0 ? `${path}.${key}` : key);
			values.push(value);
		}
	}
}

/**
 * @param {string} value The string to sanitize
 * @returns {string}
 * @private
 */
function sanitizeString(value) {
	if (value.length === 0) {
		throw new TypeError('%MSSQL.sanitizeString expects a string with a length bigger than 0.');
	}

	return `'${value.replace(/'/g, "''")}'`;
}

/**
 * @param {string} value The string to sanitize as a key
 * @returns {string}
 * @private
 */
function sanitizeKeyName(value) {
	if (typeof value !== 'string') { throw new TypeError(`%MSSQL.sanitizeString expects a string, got: ${typeof value}`); }
	if (/`/.test(value)) { throw new TypeError(`Invalid input (${value}).`); }

	return value;
}

/**
 * @param {number} [number] The limit number.
 * @param {boolean} [all] If it should show all.
 * @returns {string}
 * @private
 */
function parseRange(number, all = true) {
	return util.isNumber(number) ? `TOP ${number}` : all ? 'ALL' : '';
}

function makeVariables(number) {
	return new Array(number).fill().map((__, index) => `@${index}`).join(', ');
}
