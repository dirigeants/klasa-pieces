// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { SQLProvider, QueryBuilder, Timestamp, Type, util: { mergeDefault, isNumber, isObject } } = require('klasa');

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
			database: 'klasa'
		}, this.client.options.providers.mysql);
		this.db = await mysql.createConnection({
			host: connection.host,
			port: connection.port.toString(),
			user: connection.user,
			password: connection.password,
			database: connection.database
		});
		this.heartBeatInterval = setInterval(() => {
			this.db.query('SELECT 1=1')
				.catch(error => this.client.emit('error', error));
		}, 10000);
	}

	/* Table methods */

	hasTable(table) {
		return this.run(`SHOW TABLES LIKE '${table}';`)
			.then(result => !!result)
			.catch(() => false);
	}

	createTable(table, rows) {
		if (rows) return this.runAll(`CREATE TABLE ${sanitizeKeyName(table)} (${rows});`);

		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);

		const schemaValues = [...gateway.schema.values(true)];
		return this.run(`
			CREATE TABLE ${sanitizeKeyName(table)} (
				id VARCHAR(${gateway.idLength || 18}) NOT NULL UNIQUE${schemaValues.length ? `, ${schemaValues.map(this.qb.parse.bind(this.qb)).join(', ')}` : ''},
				PRIMARY KEY(id)
			)`
		);
	}

	deleteTable(table) {
		return this.exec(`DROP TABLE ${sanitizeKeyName(table)};`);
	}

	countRows(table) {
		return this.run(`SELECT COUNT(*) FROM ${sanitizeKeyName(table)};`)
			.then(result => result['COUNT(*)']);
	}

	/* Row methods */

	getAll(table, entries = []) {
		if (entries.length) {
			return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} WHERE id IN ('${entries.join("', '")}');`)
				.then(results => results.map(output => this.parseEntry(table, output)));
		}
		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)};`)
			.then(results => results.map(output => this.parseEntry(table, output)));
	}

	getKeys(table) {
		return this.runAll(`SELECT id FROM ${sanitizeKeyName(table)};`)
			.then(rows => rows.map(row => row.id));
	}

	get(table, key, value) {
		// If a key is given (id), swap it and search by id - value
		if (typeof value === 'undefined') {
			value = key;
			key = 'id';
		}
		return this.run(`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = ${sanitizeInput(value)} LIMIT 1;`)
			.then(result => this.parseEntry(table, result));
	}

	has(table, id) {
		return this.run(`SELECT id FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeString(id)} LIMIT 1;`)
			.then(Boolean);
	}

	getRandom(table) {
		return this.run(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY RAND() LIMIT 1;`)
			.then(result => this.parseEntry(table, result));
	}

	async getSorted(table, key, order = 'DESC', limitMin, limitMax) {
		if (order !== 'DESC' && order !== 'ASC') {
			throw new TypeError(`MySQL#getSorted 'order' parameter expects either 'DESC' or 'ASC'. Got: ${order}`);
		}

		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY ${sanitizeKeyName(key)} ${order} ${parseRange(limitMin, limitMax)};`)
			.then(results => results.map(output => this.parseEntry(table, output)));
	}

	create(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);

		// Push the id to the inserts.
		if (!keys.includes('id')) {
			keys.push('id');
			values.push(id);
		}
		return this.exec(`INSERT INTO ${sanitizeKeyName(table)} (${keys.map(sanitizeKeyName).join(', ')}) VALUES (${values.map(sanitizeInput).join(', ')});`);
	}

	update(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);
		const update = new Array(keys.length);
		for (let i = 0; i < keys.length; i++) update[i] = `${sanitizeKeyName(keys[i])} = ${sanitizeInput(values[i])}`;

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${update.join(', ')} WHERE id = ${sanitizeString(id)};`);
	}

	replace(...args) {
		return this.update(...args);
	}

	incrementValue(table, id, key, amount = 1) {
		if (amount < 0 || !isNumber(amount)) {
			throw new TypeError(`MySQL#incrementValue expects the parameter 'amount' to be an integer greater or equal than zero. Got: ${amount}`);
		}

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${key} = ${key} + ${amount} WHERE id = ${sanitizeString(id)};`);
	}

	decrementValue(table, id, key, amount = 1) {
		if (amount < 0 || !isNumber(amount)) {
			throw new TypeError(`MySQL#incrementValue expects the parameter 'amount' to be an integer greater or equal than zero. Got: ${amount}`);
		}

		return this.exec(`UPDATE ${sanitizeKeyName(table)} SET ${key} = GREATEST(0, ${key} - ${amount}) WHERE id = ${sanitizeString(id)};`);
	}

	delete(table, id) {
		return this.exec(`DELETE FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeString(id)};`);
	}

	addColumn(table, piece) {
		return this.exec(piece.type !== 'Folder' ?
			`ALTER TABLE ${sanitizeKeyName(table)} ADD COLUMN ${this.qb.parse(piece)};` :
			`ALTER TABLE ${sanitizeKeyName(table)} ${[...piece.values(true)].map(subpiece => `ADD COLUMN ${this.qb.parse(subpiece)}`).join(', ')};`);
	}

	removeColumn(table, key) {
		if (typeof key === 'string') return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} DROP COLUMN ${sanitizeKeyName(key)};`);
		if (Array.isArray(key)) return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} DROP ${key.map(sanitizeKeyName).join(', ')};`);
		throw new TypeError('Invalid usage of MySQL#removeColumn. Expected a string or string[].');
	}

	updateColumn(table, piece) {
		const [column, ...datatype] = this.qb.parse(piece).split(' ');
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} MODIFY COLUMN ${sanitizeKeyName(column)} TYPE ${datatype};`);
	}

	getColumns(table) {
		return this.runAll(`
			SELECT \`COLUMN_NAME\`
			FROM \`INFORMATION_SCHEMA\`.\`COLUMNS\`
			WHERE \`TABLE_SCHEMA\` = ${sanitizeString(this.client.options.providers.mysql.database)}
				AND \`TABLE_NAME\` = ${sanitizeString(table)};
		`).then(result => result.map(row => row.COLUMN_NAME));
	}

	run(sql) {
		return this.db.query(sql)
			.then(([rows]) => rows[0]);
	}

	runAll(sql) {
		return this.db.query(sql)
			.then(([rows]) => rows);
	}

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
 * @returns {string}
 * @private
 */
function sanitizeBoolean(value) {
	return value ? '1' : '0';
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
