const { SQLProvider, QueryBuilder, Type, Timestamp } = require('klasa');
const { resolve } = require('path');
const db = require('sqlite');
const fs = require('fs-nextra');

const TIMEPARSERS = {
	DATE: new Timestamp('YYYY-MM-DD'),
	DATETIME: new Timestamp('YYYY-MM-DD hh:mm:ss')
};

module.exports = class extends SQLProvider {

	constructor(...args) {
		super(...args);
		this.baseDir = resolve(this.client.clientBaseDir, 'bwd', 'provider', 'sqlite');
		this.qb = new QueryBuilder({
			null: 'NULL',
			integer: ({ max }) => max >= 2 ** 32 ? 'BIGINT' : 'INTEGER',
			float: 'DOUBLE PRECISION',
			boolean: { type: 'TINYINT', resolver: (input) => input ? '1' : '0' },
			date: { type: 'DATETIME', resolver: (input) => TIMEPARSERS.DATETIME.display(input) },
			time: { type: 'DATETIME', resolver: (input) => TIMEPARSERS.DATETIME.display(input) },
			timestamp: { type: 'TIMESTAMP', resolver: (input) => TIMEPARSERS.DATE.display(input) }
		});
	}

	async init() {
		await fs.ensureDir(this.baseDir);
		await fs.ensureFile(resolve(this.baseDir, 'db.sqlite'));
		return db.open(resolve(this.baseDir, 'db.sqlite'));
	}

	/* Table methods */

	/**
	 * Checks if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.runGet(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`)
			.then(Boolean);
	}

	/**
	 * Creates a new table.
	 * @param {string} table The name for the new table.
	 * @param {Array<Iterable>} rows The rows for the table.
	 * @returns {Promise<Object>}
	 */
	createTable(table, rows) {
		if (rows) return this.run(`CREATE TABLE ${sanitizeKeyName(table)} (${rows.map(([k, v]) => `${sanitizeKeyName(k)} ${v}`).join(', ')});`);
		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);

		const schemaValues = [...gateway.schema.values(true)];
		return this.run(`
			CREATE TABLE ${sanitizeKeyName(table)} (
				id VARCHAR(18) PRIMARY KEY NOT NULL UNIQUE${schemaValues.length ? `, ${schemaValues.map(this.qb.parse.bind(this.qb)).join(', ')}` : ''}
			)`
		);
	}

	/**
	 * Drops a table.
	 * @param {string} table The name of the table to drop.
	 * @returns {Promise<Object>}
	 */
	deleteTable(table) {
		return this.run(`DROP TABLE ${sanitizeKeyName(table)}`);
	}

	/* Document methods */

	/**
	 * Get all documents from a table.
	 * @param {string} table The name of the table to fetch from.
	 * @param {array} [entries] Filter the query by getting only the data which is present in the database
	 * @returns {Promise<Object[]>}
	 */
	getAll(table, entries = []) {
		if (entries.length) {
			return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} WHERE id IN ${entries.join(',')}`);
		}
		return this.runAll(`SELECT * FROM ${sanitizeKeyName(table)}`);
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
			`SELECT * FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeKeyName(key)}` :
			`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = ${sanitizeValue(value)}`)
			.then(output => this.parseEntry(table, output))
			.catch(() => null);
	}

	/**
	 * Check if a row exists.
	 * @param {string} table The name of the table
	 * @param {string} key The value to search by 'id'.
	 * @returns {Promise<boolean>}
	 */
	has(table, key) {
		return this.runGet(`SELECT id FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeValue(key)}`)
			.then(() => true)
			.catch(() => false);
	}

	/**
	 * Get a random row from a table.
	 * @param {string} table The name of the table.
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.runGet(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY RANDOM() LIMIT 1`)
			.then(output => this.parseEntry(table, output))
			.catch(() => null);
	}

	/**
	 * @param {string} table The name of the table to insert the new data
	 * @param {string} id The id of the new row to insert
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} data The data to update
	 * @returns {Promise<Object>}
	 */
	create(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);

		// Push the id to the inserts.
		keys.push('id');
		values.push(id);
		return this.run(`INSERT INTO ${sanitizeKeyName(table)} ( ${keys.map(sanitizeKeyName).join(', ')} ) VALUES ( ${values.map(sanitizeValue).join(', ')} )`);
	}

	/**
	 * @param {string} table The name of the table to update the data from
	 * @param {string} id The id of the row to update
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} data The data to update
	 * @returns {Promise<Object>}
	 */
	update(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);
		return this.run(`
			UPDATE ${sanitizeKeyName(table)}
			SET ${keys.map((key, i) => `${sanitizeKeyName(key)} = ${sanitizeValue(values[i])}`)}
			WHERE id = ${sanitizeValue(id)}`);
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
		return this.run(`DELETE FROM ${sanitizeKeyName(table)} WHERE id = ${sanitizeValue(row)}`);
	}

	/**
	 * Add a new column to a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The key to add.
	 * @param {string} datatype The datatype for the new key.
	 * @returns {Promise<*>}
	 */
	addColumn(table, key, datatype) {
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} ADD ${sanitizeKeyName(key)} ${datatype}`);
	}

	/**
	 * Remove a column from a table's schema.
	 * @param {string} table The name of the table to edit.
	 * @param {string} key The key to remove.
	 * @returns {Promise<boolean>}
	 */
	async removeColumn(table, key) {
		const gateway = this.client.gateways[gateway];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table}.`);

		const sanitizedTable = sanitizeKeyName(table),
			sanitizedCloneTable = sanitizeKeyName(`${table}_temp`);

		const allPieces = [...gateway.schema.values(true)];
		const index = allPieces.findIndex(piece => key === piece.path);
		if (index === -1) throw new Error(`There is no key ${key} defined in the current schema for ${table}.`);

		const filteredPieces = allPieces.slice();
		filteredPieces.splice(index, 1);

		const filteredPiecesNames = filteredPieces.map(piece => sanitizeKeyName(piece.path)).join(', ');

		await this.createTable(sanitizedCloneTable, filteredPieces.map(this.qb.parse.bind(this.qb)));
		await this.exec([
			`INSERT INTO ${sanitizedCloneTable} (${filteredPiecesNames})`,
			`	SELECT ${filteredPiecesNames}`,
			`	FROM ${sanitizedTable}`
		].join('\n'));
		await this.exec(`DROP TABLE ${sanitizedTable}`);
		await this.exec(`ALTER TABLE ${sanitizedCloneTable} RENAME TO ${sanitizedTable}`);
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
		const gateway = this.client.gateways[gateway];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table}.`);

		const sanitizedTable = sanitizeKeyName(table),
			sanitizedCloneTable = sanitizeKeyName(`${table}_temp`);

		const allPieces = [...gateway.schema.values(true)];
		const index = allPieces.findIndex(piece => key === piece.path);
		if (index === -1) throw new Error(`There is no key ${key} defined in the current schema for ${table}.`);

		const allPiecesNames = allPieces.map(piece => sanitizeKeyName(piece.path)).join(', ');
		const parsedDatatypes = allPieces.map(this.qb.parse.bind(this.qb));
		parsedDatatypes[index] = `${sanitizeKeyName(key)} ${datatype}`;

		await this.createTable(sanitizedCloneTable, parsedDatatypes);
		await this.exec([
			`INSERT INTO ${sanitizedCloneTable} (${allPiecesNames})`,
			`	SELECT ${allPiecesNames}`,
			`	FROM ${sanitizedTable}`
		].join('\n'));
		await this.exec(`DROP TABLE ${sanitizedTable}`);
		await this.exec(`ALTER TABLE ${sanitizedCloneTable} RENAME TO ${sanitizedTable}`);
		return true;
	}

	/**
	 * Get a row from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runGet(sql) {
		return db.get(sql);
	}

	/**
	 * Get all rows from an arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	runAll(sql) {
		return db.all(sql);
	}

	/**
	 * Run arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	run(sql) {
		return db.run(sql);
	}

	/**
	 * Execute arbitrary SQL query.
	 * @param {string} sql The query to execute.
	 * @returns {Promise<Object>}
	 */
	exec(sql) {
		return db.exec(sql);
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

function sanitizeValue(value) {
	switch (typeof value) {
		case 'boolean':
		case 'number': return value;
		case 'string': return `'${value.replace(/'/, "''")}'`;
		case 'object': return value === null ? value : JSON.stringify(value);
		default: return sanitizeValue(String(value));
	}
}
