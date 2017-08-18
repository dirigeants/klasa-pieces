const { Provider } = require('klasa');
const mysql = require('mysql2/promise');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, {
			description: 'Allows you to use MySQL functionality throught Klasa',
			sql: true
		});
		this.db = null;
		this.CONSTANTS = {
			String: 'TEXT',
			Integer: 'INT',
			Float: 'INT',
			AutoID: 'INT PRIMARY KEY AUTOINCREMENT UNIQUE',
			Timestamp: 'DATETIME',
			AutoTS: 'DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL'
		};
	}

	async init() {
		this.db = await mysql.createConnection({
			host: 'localhost',
			port: '3306',
			user: 'root',
			password: '',
			database: 'Komada'
		});
	}

	/* Table methods */

	/**
	 * Checks if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.exec(`SELECT 1 FROM ${table} LIMIT 1`)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Creates a new table.
	 * @param {string} table The name for the new table.
	 * @param {string} rows The rows for the table.
	 * @returns {Promise<Object>}
	 */
	createTable(table, rows) {
		return this.exec(`CREATE TABLE '${table}' (${rows.join(', ')})`);
	}

	/**
	 * Drops a table.
	 * @param {string} table The name of the table to drop.
	 * @returns {Promise<Object>}
	 */
	deleteTable(table) {
		return this.exec(`DROP TABLE '${table}'`);
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
			`SELECT * FROM \`${table}\` WHERE \`${options.key}\` = ${this.sanitize(options.value)}` :
			`SELECT * FROM \`${table}\``).then(([rows]) => rows);
	}

	/**
	 * Get a row from a table.
	 * @param {string} table The name of the table.
	 * @param {string} key The row id or the key to find by. If value is undefined, it'll search by 'id'.
	 * @param {string} [value=null] The desired value to find.
	 * @returns {Promise<?Object>}
	 */
	get(table, key, value = null) {
		return this.run(!value ?
			`SELECT * FROM \`${table}\` WHERE \`id\` = ${this.sanitize(key)} LIMIT 1` :
			`SELECT * FROM \`${table}\` WHERE \`${key}\` = ${this.sanitize(value)} LIMIT 1`
		).then(([rows]) => rows[0]).catch(() => null);
	}

	/**
	 * Check if a row exists.
	 * @param {string} table The name of the table
	 * @param {string} id The value to search by 'id'.
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.runAll(`SELECT \`id\` FROM \`${table}\` WHERE \`id\` = ${this.sanitize(id)} LIMIT 1`)
			.then(([rows]) => rows.length > 0);
	}

	/**
	 * Get a random row from a table.
	 * @param {string} table The name of the table.
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.run(`SELECT * FROM \`${table}\` ORDER BY RAND() LIMIT 1`);
	}

	/**
	 * Insert a new document into a table.
	 * @param {string} table The name of the table.
	 * @param {string} id The row id.
	 * @param {Object} data The object with all properties you want to insert into the document.
	 * @returns {Promise<Object>}
	 */
	create(table, id, data) {
		const { keys, values } = this.serialize(Object.assign(data, { id }));
		return this.exec(`INSERT INTO \`${table}\` (\`${keys.join('`, `')}\`) VALUES (${values.map(this.sanitize).join(', ')})`);
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
	 * @param {string} id The row id.
	 * @param {Object} data The object with all the properties you want to update.
	 * @returns {Promise<Object>}
	 */
	update(table, id, data) {
		const inserts = Object.entries(data).map(value => `\`${value[0]}\` = ${this.sanitize(value[1])}`).join(', ');
		return this.exec(`UPDATE \`${table}\` SET ${inserts} WHERE id = '${id}'`);
	}

	replace(...args) {
		return this.update(...args);
	}

	/**
	 * Delete a document from the table.
	 * @param {string} table The name of the directory.
	 * @param {string} id The row id.
	 * @returns {Promise<Object>}
	 */
	delete(table, id) {
		return this.exec(`DELETE FROM \`${table}\` WHERE id = ${this.sanitize(id)}`);
	}

	/**
	 * Update the columns from a table.
	 * @param {string} table The name of the table.
	 * @param {string[]} columns Array of columns.
	 * @param {array[]} schema Tuples of keys/values from the schema.
	 * @returns {boolean}
	 */
	async updateColumns(table, columns, schema) {
		await this.exec(`CREATE TABLE \`temp_table\` (\n${schema.map(sh => `\`${sh[0]}\` ${sh[1]}`).join(',\n')}\n);`);
		await this.exec(`INSERT INTO \`temp_table\` (\`${columns.join('`, `')}\`) SELECT \`${columns.join('`, `')}\` FROM \`${table}\`;`);
		await this.exec(`DROP TABLE \`${table}\`;`);
		await this.exec(`ALTER TABLE \`temp_table\` RENAME TO \`${table}\`;`);
		return true;
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(sql) {
		return this.db.query(sql).then(([rows]) => rows[0]).catch(throwError);
	}

	/**
	 * Get all rows from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runAll(sql) {
		return this.db.query(sql).catch(throwError);
	}

	exec(sql) {
		return this.runAll(sql);
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
