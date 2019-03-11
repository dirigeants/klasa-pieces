// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { SQLProvider, QueryBuilder, Type, Timestamp, util: { chunk } } = require('klasa');
const { resolve } = require('path');
const db = require('sqlite');
const fs = require('fs-nextra');

const valueList = amount => new Array(amount).fill('?').join(', ');

const TIMEPARSERS = {
	DATE: new Timestamp('YYYY-MM-DD'),
	DATETIME: new Timestamp('YYYY-MM-DD hh:mm:ss')
};

module.exports = class extends SQLProvider {

	constructor(...args) {
		super(...args);
		this.baseDir = resolve(this.client.userBaseDirectory, 'bwd', 'provider', 'sqlite');
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

	hasTable(table) {
		return this.runGet(`SELECT name FROM sqlite_master WHERE type='table' AND name=${sanitizeKeyName(table)};`)
			.then(Boolean);
	}

	createTable(table, rows) {
		if (rows) return this.run(`CREATE TABLE ${sanitizeKeyName(table)} (${rows.map(([k, v]) => `${sanitizeKeyName(k)} ${v}`).join(', ')});`);
		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);

		const schemaValues = [...gateway.schema.values(true)];
		return this.run(`
			CREATE TABLE ${sanitizeKeyName(table)} (
				id VARCHAR(${gateway.idLength || 18}) PRIMARY KEY NOT NULL UNIQUE${schemaValues.length ? `, ${schemaValues.map(this.qb.parse.bind(this.qb)).join(', ')}` : ''}
			);`
		);
	}

	deleteTable(table) {
		return this.run(`DROP TABLE ${sanitizeKeyName(table)};`);
	}

	/* Document methods */

	async getAll(table, entries = []) {
		let output = [];
		if (entries.length) for (const myChunk of chunk(entries, 999)) output.push(...await this.runAll(`SELECT * FROM ${sanitizeKeyName(table)} WHERE id IN ( ${valueList(myChunk.length)} );`, myChunk));
		else output = await this.runAll(`SELECT * FROM ${sanitizeKeyName(table)};`);
		return output.map(entry => this.parseEntry(table, entry));
	}

	get(table, key, value = null) {
		return this.runGet(value === null ?
			`SELECT * FROM ${sanitizeKeyName(table)} WHERE id = ?;` :
			`SELECT * FROM ${sanitizeKeyName(table)} WHERE ${sanitizeKeyName(key)} = ?;`, [value ? transformValue(value) : key])
			.then(entry => this.parseEntry(table, entry))
			.catch(() => null);
	}

	has(table, key) {
		return this.runGet(`SELECT id FROM ${sanitizeKeyName(table)} WHERE id = ?;`, [key])
			.then(() => true)
			.catch(() => false);
	}

	getRandom(table) {
		return this.runGet(`SELECT * FROM ${sanitizeKeyName(table)} ORDER BY RANDOM() LIMIT 1;`)
			.then(entry => this.parseEntry(table, entry))
			.catch(() => null);
	}

	create(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);

		// Push the id to the inserts.
		if (!keys.includes('id')) {
			keys.push('id');
			values.push(id);
		}
		return this.run(`INSERT INTO ${sanitizeKeyName(table)} ( ${keys.map(sanitizeKeyName).join(', ')} ) VALUES ( ${valueList(values.length)} );`, values.map(transformValue));
	}

	update(table, id, data) {
		const [keys, values] = this.parseUpdateInput(data, false);
		return this.run(`
			UPDATE ${sanitizeKeyName(table)}
			SET ${keys.map(key => `${sanitizeKeyName(key)} = ?`)}
			WHERE id = ?;`, [...values.map(transformValue), id]);
	}

	replace(...args) {
		return this.update(...args);
	}

	delete(table, row) {
		return this.run(`DELETE FROM ${sanitizeKeyName(table)} WHERE id = ?;`, [row]);
	}

	addColumn(table, piece) {
		return this.exec(`ALTER TABLE ${sanitizeKeyName(table)} ADD ${sanitizeKeyName(piece.path)} ${piece.type};`);
	}

	async removeColumn(table, schemaPiece) {
		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table}.`);

		const sanitizedTable = sanitizeKeyName(table),
			sanitizedCloneTable = sanitizeKeyName(`${table}_temp`);

		const allPieces = [...gateway.schema.values(true)];
		const index = allPieces.findIndex(piece => schemaPiece.path === piece.path);
		if (index === -1) throw new Error(`There is no key ${schemaPiece.key} defined in the current schema for ${table}.`);

		const filteredPieces = allPieces.slice();
		filteredPieces.splice(index, 1);

		const filteredPiecesNames = filteredPieces.map(piece => sanitizeKeyName(piece.path)).join(', ');

		await this.createTable(sanitizedCloneTable, filteredPieces.map(this.qb.parse.bind(this.qb)));
		await this.exec([
			`INSERT INTO ${sanitizedCloneTable} (${filteredPiecesNames})`,
			`	SELECT ${filteredPiecesNames}`,
			`	FROM ${sanitizedTable};`
		].join('\n'));
		await this.exec(`DROP TABLE ${sanitizedTable};`);
		await this.exec(`ALTER TABLE ${sanitizedCloneTable} RENAME TO ${sanitizedTable};`);
		return true;
	}

	async updateColumn(table, schemaPiece) {
		const gateway = this.client.gateways[table];
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table}.`);

		const sanitizedTable = sanitizeKeyName(table),
			sanitizedCloneTable = sanitizeKeyName(`${table}_temp`);

		const allPieces = [...gateway.schema.values(true)];
		const index = allPieces.findIndex(piece => schemaPiece.path === piece.path);
		if (index === -1) throw new Error(`There is no key ${schemaPiece.key} defined in the current schema for ${table}.`);

		const allPiecesNames = allPieces.map(piece => sanitizeKeyName(piece.path)).join(', ');
		const parsedDatatypes = allPieces.map(this.qb.parse.bind(this.qb));
		parsedDatatypes[index] = `${sanitizeKeyName(schemaPiece.key)} ${schemaPiece.type}`;

		await this.createTable(sanitizedCloneTable, parsedDatatypes);
		await this.exec([
			`INSERT INTO ${sanitizedCloneTable} (${allPiecesNames})`,
			`	SELECT ${allPiecesNames}`,
			`	FROM ${sanitizedTable};`
		].join('\n'));
		await this.exec(`DROP TABLE ${sanitizedTable};`);
		await this.exec(`ALTER TABLE ${sanitizedCloneTable} RENAME TO ${sanitizedTable};`);
		return true;
	}

	getColumns(table) {
		return this.runAll(`PRAGMA table_info(${sanitizeKeyName(table)});`)
			.then(result => result.map(row => row.name));
	}

	// Get a row from an arbitrary SQL query.
	runGet(...sql) {
		return db.get(...sql);
	}

	// Get all rows from an arbitrary SQL query.
	runAll(...sql) {
		return db.all(...sql);
	}

	// Run arbitrary SQL query.
	run(...sql) {
		return db.run(...sql);
	}

	// Execute arbitrary SQL query.
	exec(...sql) {
		return db.exec(...sql);
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

function transformValue(value) {
	switch (typeof value) {
		case 'boolean':
		case 'number': return value;
		case 'object': return value === null ? value : JSON.stringify(value);
		default: return String(value);
	}
}
