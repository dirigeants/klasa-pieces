const { Provider } = require('klasa');
const { Collection } = require('discord.js');
const { resolve } = require('path');
const fs = require('fs-nextra');

const Datastore = require('nedb-core');
require('tsubaki').promisifyAll(Datastore.prototype);

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, { description: 'Allows you to use NeDB functionality throught Klasa' });
		this.baseDir = resolve(this.client.clientBaseDir, 'bwd', 'provider', 'nedb');
		this.dataStores = new Collection();
	}

	init() {
		return fs.ensureDir(this.baseDir).catch(err => this.client.emit('log', err, 'error'));
	}

	/* Table methods */

	/**
	 * Check if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {boolean}
	 */
	hasTable(table) {
		return this.dataStores.has(table);
	}

	/**
	 * Create a new table.
	 * @param {string} table The name for the new table.
	 * @param {boolean} [persistent=true] Whether the DB should be persistent.
	 * @returns {Promise<void>}
	 */
	createTable(table, persistent) {
		if (this.dataStores.has(table)) return null;
		const db = new Datastore(persistent ? { filename: resolve(this.baseDir, `${table}.db`), autoload: true } : {});
		this.dataStores.set(table, db);
		return db;
	}

	/**
	 * Delete a table.
	 * @param {string} table The name of the table to delete.
	 * @returns {Promise<boolean>}
	 */
	async deleteTable(table) {
		if (this.dataStores.has(table)) {
			await this.deleteAll(table);
			this.dataStores.delete(table);
			return true;
		}
		return false;
	}

	/* Document methods */

	/**
	 * Get all entries from a table.
	 * @param {string} table The name of the table to get all entries from.
	 * @returns {Promise<Object[]>}
	 */
	async getAll(table) {
		const entries = await this.dataStores.get(table).findAsync({});
		for (const entry of entries) delete entry._id;
		return entries;
	}

	/**
	 * Get a single entry from a table by a query.
	 * @param {string} table The name of the table to get the entry from.
	 * @param {string|Object} query The query object. If it is a string, it will search by 'id'.
	 * @returns {Promise<Object>}
	 */
	async get(table, query) {
		const data = await this.dataStores.get(table).findOneAsync(resolveQuery(query));
		delete data._id;
		return data;
	}

	/**
	 * Check if a entry exists from a table by a query.
	 * @param {string} table The name of the table to check the entry from.
	 * @param {string|Object} query The query object. If it is a string, it will search by 'id'.
	 * @returns {Promise<boolean>}
	 */
	has(table, query) {
		return this.get(table, query).then(result => !!result);
	}

	/**
	 * Insert a new entry into a table.
	 * @param {string} table The name of the table to insert the entry.
	 * @param {string|Object} query The query object. If it is a string, it will be keyed by 'id'.
	 * @param {Object} doc The data you want the entry to contain.
	 * @returns {Promise<Object>}
	 */
	create(table, query, doc) {
		return this.dataStores.get(table).insertAsync(Object.assign(doc, resolveQuery(query)));
	}

	set(...args) {
		return this.create(...args);
	}

	insert(...args) {
		return this.create(...args);
	}

	/**
	 * Update an entry from a table.
	 * @param {string} table The name of the table to update the entry from.
	 * @param {string|Object} query The query object. If it is a string, it will search by 'id'.
	 * @param {Object} doc The data you want to update.
	 * @returns {Promise<boolean>}
	 */
	async update(table, query, doc) {
		const res = await this.get(table, query);
		return this.replace(table, query, Object.assign(res, doc));
	}

	/**
	 * Replace an entry from a table.
	 * @param {string} table The name of the table to update the entry from.
	 * @param {string|Object} query The query object. If it is a string, it will search by 'id'.
	 * @param {Object} doc The data you want to update.
	 * @returns {Promise<boolean>}
	 */
	async replace(table, query, doc) {
		await this.dataStores.get(table).updateAsync(resolveQuery(query), doc);
		await this.dataStores.get(table).persistence.compactDatafile();
		return true;
	}

	/**
	 * Delete a single or all entries from a table that matches the query.
	 * @param {string} table The name of the table to delete the entry from.
	 * @param {string|Object} query The query object. If it is a string, it will search by 'id'.
	 * @param {boolean} [all=false] Option to delete all documents that match the query.
	 * @returns {Promise<number>} Returns a Promise with the number of documents deleted.
	 */
	delete(table, query, all = false) {
		return this.dataStores.get(table).removeAsync(resolveQuery(query), { multi: all });
	}

	/**
	 * Delete all entries from a table.
	 * @param {string} table The name of the table to delete the entries from.
	 * @returns {Promise<number>} Returns a Promise with the number of documents deleted.
	 */
	deleteAll(table) {
		return this.delete(table, {}, true);
	}

	/**
	 * Count the amount of entries from a table based on the query.
	 * @param {string} table The name of the table to count the entries from.
	 * @param {string|Object} [query={}] The query object. If it is a string, it will search by 'id'.
	 * @returns {Promise<number>} The amount of entries that matches the query.
	 */
	count(table, query = {}) {
		return this.dataStores.get(table).countAsync(resolveQuery(query));
	}

};

const resolveQuery = query => query instanceof Object ? query : { id: query };
