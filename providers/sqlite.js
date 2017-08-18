const { Provider } = require('klasa');
const { resolve } = require('path');
const db = require('sqlite');
const fs = require('fs-nextra');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, {
			description: 'Allows you use SQLite functionality throughout klasa.',
			sql: true
		});
		this.baseDir = resolve(this.client.clientBaseDir, 'bwd', 'provider', 'sqlite');
		this.CONSTANTS = {
			String: 'TEXT',
			Integer: 'INTEGER',
			Float: 'INTEGER',
			AutoID: 'INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE',
			Timestamp: 'DATETIME',
			AutoTS: 'DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL'
		};
	}

	async init() {
		await fs.ensureDir(this.baseDir).catch(throwError);
		await fs.ensureFile(resolve(this.baseDir, 'db.sqlite')).catch(throwError);
		return db.open(resolve(this.baseDir, 'db.sqlite')).catch(throwError);
	}

	/* Table methods */

	/**
	 * Checks if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.runGet(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`)
			.then(row => !!row);
	}

	/**
	 * Creates a new table.
	 * @param {string} table The name for the new table.
	 * @param {string} rows The rows for the table.
	 * @returns {Promise<Object>}
	 */
	createTable(table, rows) {
		return this.run(`CREATE TABLE '${table}' (${rows.join(', ')});`);
	}

	/**
	 * Drops a table.
	 * @param {string} table The name of the table to drop.
	 * @returns {Promise<Object>}
	 */
	deleteTable(table) {
		return this.run(`DROP TABLE '${table}'`);
	}

	/* Document methods */

	/**
	 * Get all documents from a table.
	 * @param {string} table The name of the table to fetch from.
	 * @param {Object} options key and value.
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, options = {}) {
		return this.runAll(options.key && options.value ?
			`SELECT * FROM '${table}' WHERE ${options.key} = ${this.sanitize(options.value)}` :
			`SELECT * FROM '${table}'`);
	}

	/**
	 * Get a row from a table.
	 * @param {string} table The name of the table.
	 * @param {string} key The row id or the key to find by. If value is undefined, it'll search by 'id'.
	 * @param {string} [value=null] The desired value to find.
	 * @returns {Promise<?Object>}
	 */
	get(table, key, value = null) {
		return this.runGet(!value ?
			`SELECT * FROM ${table} WHERE id = ${this.sanitize(key)}` :
			`SELECT * FROM ${table} WHERE ${key} = ${this.sanitize(value)}`).catch(() => null);
	}

	/**
	 * Check if a row exists.
	 * @param {string} table The name of the table
	 * @param {string} key The value to search by 'id'.
	 * @returns {Promise<boolean>}
	 */
	has(table, key) {
		return this.runGet(`SELECT id FROM '${table}' WHERE id = ${this.sanitize(key)}`)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Get a random row from a table.
	 * @param {string} table The name of the table.
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.runGet(`SELECT * FROM '${table}' ORDER BY RANDOM() LIMIT 1`).catch(() => null);
	}

	/**
	 * Insert a new document into a table.
	 * @param {string} table The name of the table.
	 * @param {string} row The row id.
	 * @param {Object} data The object with all properties you want to insert into the document.
	 * @returns {Promise<Object>}
	 */
	create(table, row, data) {
		const { keys, values } = this.serialize(Object.assign(data, { id: row }));
		return this.run(`INSERT INTO '${table}' (${keys.join(', ')}) VALUES(${values.map(this.sanitize).join(', ')})`);
	}

	set(...args) {
		return this.create(...args);
	}

	insert(...args) {
		return this.create(...args);
	}

	/**
	 * Update a row from a table.
	 * @param {string} table The name of the table.
	 * @param {string} row The row id.
	 * @param {Object} data The object with all the properties you want to update.
	 * @returns {Promise<Object>}
	 */
	update(table, row, data) {
		const inserts = Object.entries(data).map(value => `${value[0]} = ${this.sanitize(value[1])}`).join(', ');
		return this.run(`UPDATE '${table}' SET ${inserts} WHERE id = '${row}'`);
	}

	replace(...args) {
		return this.update(...args);
	}

	/**
	 * Delete a document from the table.
	 * @param {string} table The name of the table.
	 * @param {string} row The row id.
	 * @returns {Promise<Object>}
	 */
	delete(table, row) {
		return this.run(`DELETE FROM '${table}' WHERE id = ${this.sanitize(row)}`);
	}

	/**
	 * Update the columns from a table.
	 * @param {string} table The name of the table.
	 * @param {string[]} columns Array of columns.
	 * @param {array[]} schema Tuples of keys/values from the schema.
	 * @returns {boolean}
	 */
	async updateColumns(table, columns, schema) {
		await this.run(`CREATE TABLE \`temp_table\` (\n${schema.map(sh => `\`${sh[0]}\` ${sh[1]}`).join(',\n')}\n);`);
		await this.run(`INSERT INTO \`temp_table\` (\`${columns.join('`, `')}\`) SELECT \`${columns.join('`, `')}\` FROM \`${table}\`;`);
		await this.run(`DROP TABLE \`${table}\`;`);
		await this.run(`ALTER TABLE \`temp_table\` RENAME TO \`${table}\`;`);
		return true;
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runGet(sql) {
		return db.get(sql).catch(throwError);
	}

	/**
	 * Get all rows from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runAll(sql) {
		return db.all(sql).catch(throwError);
	}

	/**
	 * Run arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(sql) {
		return db.run(sql).catch(throwError);
	}

	/**
	 * Execute arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	exec(sql) {
		return db.exec(sql).catch(throwError);
	}

	/**
	 * Transform NoSQL queries into SQL.
	 * @param {Object} data The object.
	 * @returns {Object}
	 */
	serialize(data) {
		const keys = [];
		const values = [];
		const entries = Object.entries(data);
		for (let i = 0; i < entries.length; i++) {
			[keys[i], values[i]] = entries[i];
		}

		return { keys, values };
	}

	sanitize(string) {
		if (typeof string === 'string') return `'${string.replace(/'/g, "''")}'`;
		return `'${JSON.stringify(string).replace(/'/g, "''")}'`;
	}

};

const throwError = (err) => { throw err; };
