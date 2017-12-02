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
		const query = rows.map(row => `'${row[0]}' ${row[1]}`).join(', ');
		return this.run(`CREATE TABLE '${table}' (${query});`);
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
		return this.runGet(value === null ?
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
	 * @param {Array<string[]>} inserts The object with all properties you want to insert into the document.
	 * @returns {Promise<*>}
	 */
	create(table, row, inserts = []) {
		if (Array.isArray(inserts) === false) throw new TypeError('SQLite#create only accepts string[][] as input for the inserts parameter.');

		const keys = [];
		const values = [];
		for (let i = 0; i < inserts.length; i++) {
			keys.push(inserts[i][0]);
			values.push(inserts[i][1]);
		}
		return this.run(`INSERT INTO '${table}' ( ${keys.join(', ')} ) VALUES( ${values.join(', ')} )`);
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
	 * @param {Object} inserts The object with all the properties you want to update.
	 * @returns {Promise<Object>}
	 */
	update(table, row, inserts) {
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
		return this.run(`DELETE FROM '${table}' WHERE id = '${row}'`);
	}

	/**
	 * Add a new column to a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The key to add.
	 * @param {string} datatype The datatype for the new key.
	 * @returns {Promise<*>}
	 */
	addColumn(table, key, datatype) {
		return this.exec(`ALTER TABLE \`${table}\` ADD \`${key}\` ${datatype}`);
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The key to remove.
	 * @returns {Promise<boolean>}
	 */
	async removeColumn(table, key) {
		const columns = await this.getColumns(table);
		const newSchema = [];
		const newColumns = [];
		for (let i = 0; i < columns.length; i++) {
			if (columns[i][0] === key) continue;
			newSchema.push(`\`${columns[i][0]}\` ${columns[i][1]}`);
			newColumns.push(columns[i][0]);
		}
		await this.exec(`CREATE TABLE \`${table}_temp\` ( ${newSchema.join(',\n')} \n)`);
		await this.exec([
			`INSERT INTO \`${table}_temp\` (\`${newColumns.join('`, `')}\`)`,
			`	SELECT \`${newColumns.join('`, `')}\``,
			`	FROM \`${table}\``
		].join('\n'));
		await this.exec(`DROP TABLE \`${table}\``);
		await this.exec(`ALTER TABLE \`${table}_temp\` RENAME TO \`${table}\``);
		return true;
	}

	/**
	 * Edit the key's datatype from the table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The name of the column to update.
	 * @param {string} datatype The new datatype for the column.
	 * @returns {Promise<boolean>}
	 */
	async updateColumn(table, key, datatype) {
		const columns = await this.getColumns(table);
		const newSchema = [];
		const newColumns = [];
		for (let i = 0; i < columns.length; i++) {
			if (columns[i][0] === key) columns[i][1] = datatype;
			newSchema.push(`\`${columns[i][0]}\` ${columns[i][1]}`);
			newColumns.push(columns[i][0]);
		}
		await this.exec(`CREATE TABLE \`${table}_temp\` ( ${newSchema.join(',\n')} \n)`);
		await this.exec([
			`INSERT INTO \`${table}_temp\` (\`${newColumns.join('`, `')}\`)`,
			`	SELECT \`${newColumns.join('`, `')}\``,
			`	FROM \`${table}\``
		].join('\n'));
		await this.exec(`DROP TABLE \`${table}\``);
		await this.exec(`ALTER TABLE \`${table}_temp\` RENAME TO \`${table}\``);
		return true;
	}

	/**
	 * Get an array of tuples containing all the keys and datatypes from a table.
	 * @param {string} table The name of the table to edit.
	 * @returns {Array<string[]>}
	 */
	async getColumns(table) {
		const result = await this.runGet(`SELECT sql FROM sqlite_master WHERE tbl_name = '${table}' AND type = 'table'`);
		const raw = /\(([^)]+)\)/.exec(result.sql);
		if (raw === null) return [];
		const columns = raw[1].split('\n');
		const output = [];
		for (let i = 0; i < columns.length; i++) {
			const trimmed = columns[i].trim();
			if (trimmed.length === 0) continue;
			const prc = /`([^`]+)`\s*([^,]+)/.exec(trimmed);
			if (prc === null) continue;
			output.push([prc[1], prc[2]]);
		}

		return output;
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runGet(sql) {
		console.log(sql);
		return db.get(sql).catch(throwError);
	}

	/**
	 * Get all rows from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runAll(sql) {
		console.log(sql);
		return db.all(sql).catch(throwError);
	}

	/**
	 * Run arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(sql) {
		console.log(sql);
		return db.run(sql).catch(throwError);
	}

	/**
	 * Execute arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	exec(sql) {
		console.log(sql);
		return db.exec(sql).catch(throwError);
	}

	sanitize(value) {
		const type = typeof value;
		switch (type) {
			case 'boolean':
			case 'number': return value;
			case 'string': return `'${value}'`;
			case 'object': return value === null ? value : JSON.stringify(value);
			default: return value;
		}
	}

};

const throwError = (err) => { throw err; };
