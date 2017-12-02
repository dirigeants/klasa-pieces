const { Provider } = require('klasa');
const mysql = require('mysql2/promise');

module.exports = class MySQL extends Provider {

	constructor(...args) {
		super(...args, {
			enabled: true,
			sql: true,
			description: 'Allows you to use MySQL functionality throught Klasa'
		});
		this.TYPES = DATATYPES;
		this.db = null;
	}

	async init() {
		this.db = await mysql.createConnection(this.client.config.provider.mysql || {
			host: 'localhost',
			port: '3306',
			user: 'root',
			password: '',
			database: 'Klasa'
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
		requestType('MySQL#hasTable', 'table', 'string', table);
		return this.run(`SHOW TABLES LIKE '${table}';`)
			.then(result => !!result)
			.catch(() => false);
	}

	/**
	 * @param {string} table The name of the table to create
	 * @param {string} rows The rows with their respective datatypes
	 * @returns {Promise<Object[]>}
	 */
	createTable(table, rows) {
		requestType('MySQL#createTable', 'table', 'string', table);
		requestType('MySQL#createTable', 'rows', 'string', rows);
		return this.runAll(`CREATE TABLE ${sanitizeKeyName(table)} (${rows});`);
	}

	/**
	 * @param {string} table The name of the table to drop
	 * @returns {Promise<Object[]>}
	 */
	deleteTable(table) {
		requestType('MySQL#deleteTable', 'table', 'string', table);
		return this.exec(`DROP TABLE ${sanitizeKeyName(table)};`);
	}

	/**
	 * @param {string} table The table with the rows to count
	 * @returns {Promise<number>}
	 */
	countRows(table) {
		requestType('MySQL#deleteTable', 'table', 'string', table);
		return this.run(`SELECT COUNT(*) FROM ${sanitizeKeyName(table)};`)
			.then(result => result['COUNT(*)']);
	}

	/* Row methods */

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} [key] The key to filter the data from. Requires the value parameter
	 * @param {any}    [value] The value to filter the data from. Requires the key parameter
	 * @param {number} [limitMin] The minimum range. Must be higher than zero
	 * @param {number} [limitMax] The maximum range. Must be higher than the limitMin parameter
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, key, value, limitMin, limitMax) {
		requestType('MySQL#getAll', 'table', 'string', table);
		if (typeof key !== 'undefined' && typeof value !== 'undefined') {
			requestType('MySQL#getAll', 'key', 'string', key);
			return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = ${sanitizeInput(value)} ${parseRange(limitMin, limitMax)};`);
		}

		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} ${parseRange(limitMin, limitMax)};`);
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object[]>}
	 */
	getKeys(table) {
		requestType('MySQL#getKeys', 'table', 'string', table);
		return this.runAll(`SELECT id FROM ${sanitizeKeyName(table)};`)
			.then(rows => rows.map(row => row.id));
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} key The key to filter the data from
	 * @param {any}    [value] The value of the filtered key
	 * @returns {Promise<Object>}
	 */
	get(table, key, value) {
		requestType('MySQL#get', 'table', 'string', table);

		// If a key is given (id), swap it and search by id - value
		if (typeof value === 'undefined') {
			value = key;
			key = 'id';
		}
		requestType('MySQL#get', 'key', 'string', key);
		requestValue('MySQL#get', 'value', value);
		return this.run(`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = ${sanitizeInput(value)} LIMIT 1;`)
			.catch(throwError);
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @param {string} id    The value of the id
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		requestType('MySQL#has', 'table', 'string', table);
		requestType('MySQL#has', 'id', 'string', id);
		return this.run(`SELECT id FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeString(id)} LIMIT 1;`)
			.then(row => !!row);
	}

	/**
	 * @param {string} table The name of the table to get the data from
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		requestType('MySQL#getRandom', 'table', 'string', table);
		return this.run(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY RAND() LIMIT 1;`);
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
		requestType('MySQL#getSorted', 'table', 'string', table);
		requestType('MySQL#getSorted', 'key', 'string', key);
		if (order !== 'DESC' && order !== 'ASC') { throw new TypeError(`MySQL#getSorted 'order' parameter expects either 'DESC' or 'ASC'. Got: ${order}`); }

		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY ${sanitizeKeyName(key)} ${order} ${parseRange(limitMin, limitMax)};`);
	}

	/**
	 * @param {string} table The name of the table to insert the new data
	 * @param {string} id The id of the new row to insert
	 * @param {(string|string[]|{})} param1 The first parameter to validate.
	 * @param {any} [param2] The second parameter to validate.
	 * @returns {Promise<any[]>}
	 */
	insert(table, id, param1, param2) {
		requestType('MySQL#insert', 'table', 'string', table);
		requestType('MySQL#insert', 'id', 'string', id);
		const [keys, values] = acceptArbitraryInput(param1, param2);

		// Push the id to the inserts.
		keys.push('id');
		values.push(id);
		return this.exec(`INSERT INTO ${sanitizeKeyName(table)} (${keys.map(sanitizeKeyName).join(', ')}) VALUES (${values.map(sanitizeInput).join(', ')});`);
	}

	/**
	 * @param {...*} args The arguments
	 * @alias MySQL#insert
	 * @returns {Promise<any[]>}
	 */
	create(...args) {
		return this.insert(...args);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {(string|string[]|{})} param1 The first parameter to validate.
	 * @param {any} [param2] The second parameter to validate.
	 * @returns {Promise<any[]>}
	 */
	update(table, id, param1, param2) {
		requestType('MySQL#update', 'table', 'string', table);
		requestType('MySQL#update', 'id', 'string', id);

		const [keys, values] = acceptArbitraryInput(param1, param2);
		const update = new Array(keys.length);
		for (let i = 0; i < keys.length; i++) update[i] = `${sanitizeKeyName(keys[i])} = ${sanitizeInput(values[i])}`;

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${update.join(', ')} WHERE id = ${sanitizeString(id)};`);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {string} key The key to update
	 * @param {number} [amount=1] The value to increase
	 * @returns {Promise<any[]>}
	 */
	incrementValue(table, id, key, amount = 1) {
		requestType('MySQL#incrementValue', 'table', 'string', table);
		requestType('MySQL#incrementValue', 'id', 'string', id);
		requestType('MySQL#incrementValue', 'key', 'string', key);
		requestType('MySQL#incrementValue', 'amount', 'number', amount);
		if (amount < 0 || isNaN(amount) || Number.isInteger(amount) === false || Number.isSafeInteger(amount) === false) {
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
		requestType('MySQL#decrementValue', 'table', 'string', table);
		requestType('MySQL#decrementValue', 'id', 'string', id);
		requestType('MySQL#decrementValue', 'key', 'string', key);
		requestType('MySQL#decrementValue', 'amount', 'number', amount);
		if (amount < 0 || isNaN(amount) || Number.isInteger(amount) === false || Number.isSafeInteger(amount) === false) {
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
		requestType('MySQL#delete', 'table', 'string', table);
		return this.exec(`DELETE FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeString(id)};`);
	}

	/**
	 * Add a new column to a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The key to add.
	 * @param {string} datatype The datatype for the new key.
	 * @returns {Promise<any[]>}
	 */
	addColumn(table, key, datatype) {
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} ADD ${sanitizeKeyName(key)} ${datatype};`);
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The key to remove.
	 * @returns {Promise<any[]>}
	 */
	removeColumn(table, key) {
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} DROP COLUMN ${sanitizeKeyName(key)};`);
	}

	/**
	 * Edit the key's datatype from the table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The name of the column to update.
	 * @param {string} datatype The new datatype for the column.
	 * @returns {Promise<any[]>}
	 */
	updateColumn(table, key, datatype) {
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} MODIFY COLUMN ${sanitizeKeyName(key)} ${datatype};`);
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(sql) {
		return this.db.query(sql)
			.then(([rows]) => rows[0])
			.catch(throwError);
	}

	/**
	 * Get all rows from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object[]>}
	 */
	runAll(sql) {
		return this.db.query(sql)
			.then(([rows]) => rows)
			.catch(throwError);
	}

	/**
	 *
	 * @param {string} sql The query to execute
	 * @returns {Promise<Object[]>}
	 */
	exec(sql) {
		return this.db.query(sql)
			.catch(throwError);
	}

};

/**
 * Accept any kind of input from two parameters.
 * @param {(string|string[]|{})} param1 The first parameter to validate.
 * @param {any} [param2] The second parameter to validate.
 * @returns {[[], []]}
 * @private
 */
function acceptArbitraryInput(param1, param2) {
	if (typeof param1 === 'string' && typeof param2 !== 'undefined') return [[param1], [param2]];
	if (Array.isArray(param1) && Array.isArray(param2)) {
		if (param1.length !== param2.length) throw new TypeError(`The array lengths do not match: ${param1.length}-${param2.length}`);
		if (param1.some(value => typeof value !== 'string')) throw new TypeError(`The array of keys must be an array of strings, but found a value that does not match.`);
		return [param1, param2];
	}
	if (isObject(param1) && typeof param2 === 'undefined') {
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
		if (isObject(value)) {
			getEntriesFromObject(value, [keys, values], path.length > 0 ? `${path}.${key}` : key);
		} else {
			keys.push(path.length > 0 ? `${path}.${key}` : key);
			values.push(value);
		}
	}
}

/**
 * Check if a value is an object.
 * @param {any} object The object to validate.
 * @returns {boolean}
 * @private
 */
function isObject(object) {
	return Object.prototype.toString.call(object) === '[object Object]';
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
	if (isNaN(min) || Number.isInteger(min) === false || Number.isSafeInteger(min) === false) {
		throw new TypeError(`%MySQL.parseRange 'min' parameter expects an integer or undefined, got ${min}`);
	}
	if (min < 0) {
		throw new TypeError(`%MySQL.parseRange 'min' parameter expects to be equal or greater than zero, got ${min}`);
	}

	// Max value validation
	if (typeof max !== 'undefined') {
		if (typeof max !== 'number' || isNaN(max) || Number.isInteger(max) === false || Number.isSafeInteger(max) === false) {
			throw new TypeError(`%MySQL.parseRange 'max' parameter expects an integer or undefined, got ${max}`);
		}
		if (max <= min) {
			throw new TypeError(`%MySQL.parseRange 'max' parameter expects ${max} to be greater than ${min}. Got: ${max} <= ${min}`);
		}
	}

	return `LIMIT ${min}${typeof max === 'number' ? `,${max}` : ''}`;
}

/**
 * @param {string} method The name of the method
 * @param {string} parameter The parameter name
 * @param {string} type The expected primitive type of the parameter
 * @param {any} value The value to test
 * @private
 */
function requestType(method, parameter, type, value) {
	const currentType = typeof value;
	if (currentType !== type) throw new TypeError(`${method} '${parameter}' parameter expects type of ${type}. Got: ${currentType}`);
}

/**
 * @param {string} method The name of the method
 * @param {string} parameter The parameter name
 * @param {any} value The value to test if undefined
 * @private
 */
function requestValue(method, parameter, value) {
	const currentType = typeof value;
	if (currentType === 'undefined') throw new TypeError(`${method} '${parameter}' parameter expects a value. Got: undefined`);
}

/**
 * @param {number} value The number to sanitize
 * @returns {string}
 * @private
 */
function sanitizeInteger(value) {
	if (isNaN(value) || Number.isInteger(value) === false || Number.isSafeInteger(value) === false) {
		throw new TypeError(`%MySQL.sanitizeNumber expects an integer, got ${value}`);
	}
	if (value < 0) { throw new TypeError(`%MySQL.sanitizeNumber expects a positive integer, got ${value}`); }

	return String(value);
}

/**
 * @param {string} value The string to sanitize
 * @returns {string}
 * @private
 */
function sanitizeString(value) {
	if (value.length === 0) { throw new TypeError('%MySQL.sanitizeString expects a string with a length bigger than 0.'); }

	return `'${value.replace(/'/g, "''")}'`;
}

/**
 * @param {string} value The string to sanitize as a key
 * @returns {string}
 * @private
 */
function sanitizeKeyName(value) {
	if (typeof value !== 'string') { throw new TypeError(`%MySQL.sanitizeString expects a string, got: ${typeof value}`); }
	if (/`/.test(value)) { throw new TypeError(`Invalid input (${value}).`); }

	return `\`${value}\``;
}

/**
 * @param {Object} value The object to sanitize
 * @returns {string}
 * @private
 */
function sanitizeObject(value) {
	if (value === null) return 'NULL';
	if (Array.isArray(value)) return sanitizeString(JSON.stringify(value));
	const type = Array.prototype.toString.call(value);
	if (type === '[object Object]') return sanitizeString(JSON.stringify(value));
	throw new TypeError(`%MySQL.sanitizeObject expects NULL, an array, or an object. Got: ${type}`);
}

/**
 *
 * @param {any} value The value to sanitize
 * @returns {string}
 * @private
 */
function sanitizeInput(value) {
	const type = typeof value;
	switch (type) {
		case 'string': return sanitizeString(value);
		case 'number': return sanitizeInteger(value);
		case 'object': return sanitizeObject(value);
		default: throw new TypeError(`%MySQL.sanitizeInput expects type of string, number, or object. Got: ${type}`);
	}
}

// In several V8 versions, Promise errors do not bubble up, this workaround
// forces errors to do so.
const throwError = (err) => { throw err; };

const DATATYPES = {
	DECIMAL: 'DECIMAL',
	TINYINT: 'TINY',
	SMALLINT: 'SHORT',
	INT: 'LONG',
	FLOAT: 'FLOAT',
	DOUBLE: 'DOUBLE',
	NULL: 'NULL',
	TIMESTAMP: 'TIMESTAMP',
	BIGINT: 'LONGLONG',
	MEDIUMINT: 'INT24',
	DATE: 'DATE',
	TIME: 'TIME',
	DATETIME: 'DATETIME',
	YEAR: 'YEAR',
	NEWDATE: 'NEWDATE',
	VARCHAR: 'VARCHAR',
	BIT: 'BIT',
	JSON: 'JSON',
	NEWDECIMAL: 'NEWDECIMAL',
	ENUM: 'ENUM',
	SET: 'SET',
	TINYBLOB: 'TINY_BLOB',
	MEDIUMBLOB: 'MEDIUM_BLOB',
	LONGBLOB: 'LONG_BLOB',
	BLOB: 'BLOB',
	TEXT: 'TEXT',
	STRING: 'STRING',
	GEOMETRY: 'GEOMETRY'
};
