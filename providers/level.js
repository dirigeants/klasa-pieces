// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Provider, util: { mergeObjects } } = require('klasa');
const { Collection } = require('discord.js');
const { resolve } = require('path');
const fs = require('fs-nextra');
const Level = require('level');

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

	async deleteTable(table) {
		if (this.tables.has(table)) {
			await this.tables.get(table).close();
			await fs.unlink(`${this.baseDir}/${table}`);
			return this.tables.delete(table);
		}
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
					data = JSON.parse(data.value);
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

	get(table, id) {
		return this.tables.get(table).get(id).then(JSON.parse).catch(() => null);
	}

	has(table, id) {
		return this.tables.get(table).has(id);
	}

	create(table, id, data = {}) {
		return this.tables.get(table).put(id, JSON.stringify({ id, ...this.parseUpdateInput(data) }));
	}

	update(table, id, data) {
		return this.get(table, id)
			.then(existent => this.create(table, id, mergeObjects(existent || { id }, this.parseUpdateInput(data))));
	}

	replace(table, id, data) {
		return this.create(table, id, data);
	}

	delete(table, id) {
		return this.get(table, id)
			.then(db => db.del(id));
	}

};
