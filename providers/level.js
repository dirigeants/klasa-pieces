const { Provider, util: { mergeObjects } } = require('klasa');
const { Collection } = require('discord.js');
const { resolve } = require('path');
const fs = require('fs-nextra');
const Level = require('native-level-promise');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.baseDir = resolve(this.client.userBaseDirectory, 'bwd', 'provider', 'level');
		this.tables = new Collection();
	}

	/**
	 * Closes the DB
	 */
	shutdown() {
		for (const db of this.tables.values()) db.close();
	}

	async init() {
		await fs.ensureDir(this.baseDir);
		const files = await fs.readdir(this.baseDir);
		for (const file of files) this.createTable(file);
	}

	/* Table methods */

	hasTable(table) {
		return this.tables.has(table);
	}

	createTable(table) {
		return this.tables.set(table, new Level(resolve(this.baseDir, table)));
	}

	deleteTable(table) {
		if (this.tables.has(table)) return this.tables.get(table).destroy();
		return Promise.resolve();
	}

	/* Document methods */

	getAll(table, filter = []) {
		const db = this.tables.get(table);
		if (!db) return Promise.reject(new Error(`The table ${table} does not exist.`));
		return new Promise((res) => {
			const output = [];
			const stream = db.createReadStream()
				.on('data', filter.length ? (data) => {
					data = JSON.parse(data);
					if (filter.includes(data.id)) output.push(data);
				} : (data) => output.push(JSON.parse(data.value)))
				.once('end', () => {
					stream.removeAllListeners();
					res(output);
				});
		});
	}

	getKeys(table) {
		const db = this.tables.get(table);
		if (!db) return Promise.reject(new Error(`The table ${table} does not exist.`));
		return new Promise((res) => {
			const output = [];
			const stream = db.keyStream()
				.on('data', key => output.push(key))
				.once('end', () => {
					stream.removeAllListeners();
					res(output);
				});
		});
	}

	get(table, document) {
		return this.tables.get(table).get(document).then(JSON.parse).catch(() => null);
	}

	has(table, document) {
		return this.tables.get(table).has(document);
	}

	create(table, document, data = {}) {
		return this.tables.get(table).put(document, JSON.stringify(mergeObjects(this.parseUpdateInput(data), { id: document })));
	}

	update(table, document, data) {
		return this.get(table, document)
			.then(existent => this.create(table, document, mergeObjects(existent || { id: document }, this.parseUpdateInput(data))));
	}

	replace(table, document, data) {
		return this.create(table, document, data);
	}

	delete(table, document) {
		return this.get(table, document)
			.then(db => db.delete(document));
	}

};
