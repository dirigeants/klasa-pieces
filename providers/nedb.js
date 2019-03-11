// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Provider, util: { mergeObjects, isObject } } = require('klasa');
const { Collection } = require('discord.js');
const { resolve } = require('path');
const fs = require('fs-nextra');

const Datastore = require('nedb-core');
require('tsubaki').promisifyAll(Datastore.prototype);

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.baseDir = resolve(this.client.userBaseDirectory, 'bwd', 'provider', 'nedb');
		this.dataStores = new Collection();
	}

	init() {
		return fs.ensureDir(this.baseDir);
	}

	/* Table methods */

	hasTable(table) {
		return this.dataStores.has(table);
	}

	createTable(table, persistent) {
		if (this.dataStores.has(table)) return null;
		const db = new Datastore(persistent ? { filename: resolve(this.baseDir, `${table}.db`), autoload: true } : {});
		this.dataStores.set(table, db);
		return db;
	}

	async deleteTable(table) {
		if (this.dataStores.has(table)) {
			await this.deleteAll(table);
			this.dataStores.delete(table);
			return true;
		}
		return false;
	}

	/* Document methods */

	async getAll(table, filter = []) {
		let entries;
		if (filter.length) entries = await this.dataStores.get(table).findAsync({ id: { $in: filter } });
		else entries = await this.dataStores.get(table).findAsync({});
		for (const entry of entries) delete entry._id;
		return entries;
	}

	async get(table, query) {
		const data = await this.dataStores.get(table).findOneAsync(resolveQuery(query));
		if (data) {
			delete data._id;
			return data;
		}

		return null;
	}

	has(table, query) {
		return this.get(table, query).then(Boolean);
	}

	create(table, query, doc) {
		return this.dataStores.get(table).insertAsync(mergeObjects(this.parseUpdateInput(doc), resolveQuery(query)));
	}

	async update(table, query, doc) {
		const res = await this.get(table, query);
		return this.replace(table, query, mergeObjects(res, this.parseUpdateInput(doc)));
	}

	async replace(table, query, doc) {
		await this.dataStores.get(table).updateAsync(resolveQuery(query), this.parseUpdateInput(doc));
		await this.dataStores.get(table).persistence.compactDatafile();
		return true;
	}

	delete(table, query, all = false) {
		return this.dataStores.get(table).removeAsync(resolveQuery(query), { multi: all });
	}

	deleteAll(table) {
		return this.delete(table, {}, true);
	}

	count(table, query = {}) {
		return this.dataStores.get(table).countAsync(resolveQuery(query));
	}

};

const resolveQuery = query => isObject(query) ? query : { id: query };
