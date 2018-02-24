const { Provider } = require('klasa');
const { resolve } = require('path');
const fs = require('fs-nextra');
const Level = require('native-level-promise');
const Collection = require('djs-collection');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, {
			name: 'level',
			description: 'Allows you to use LevelDB functionality throught Klasa'
		});
		this.baseDir = resolve(this.client.clientBaseDir, 'bwd', 'provider', 'level');
		this.tables = new Collection();
	}

	/**
	 * Closes the DB
	 */
	shutdown() {
		for (const db of this.tables.values()) db.close();
	}

	/**
	 * Inits the database
	 * @private
	 */
	async init() {
		await fs.ensureDir(this.baseDir).catch(err => this.client.emit('log', err, 'error'));
		const files = await fs.readdir(this.baseDir).catch(err => this.client.emit('log', err, 'error'));
		for (const file of files) this.createTable(file);
	}

	/* Table methods */

	/**
     * Checks if a directory exists.
     * @param {string} table The name of the table you want to check.
     * @returns {Promise<boolean>}
     */
	hasTable(table) {
		return this.tables.has(table);
	}

	/**
     * Creates a new directory.
     * @param {string} table The name for the new directory.
     * @returns {Promise<void>}
     */
	createTable(table) {
		return this.tables.set(table, new Level(resolve(this.baseDir, table)));
	}

	/**
     * Recursively deletes a directory.
     * @param {string} table The directory's name to delete.
     * @returns {Promise<void>}
     */
	deleteTable(table) {
		if (!this.hasTable(table)) return Promise.resolve();
		return this.tables.get(table).destroy();
	}

	/* Document methods */

	/**
     * Get all documents from a directory.
     * @param {string} table The name of the directory to fetch from.
     * @returns {Promise<Object[]>}
     */
	async getAll(table) {
		const keys = await this.getKeys(table);
		if (keys.length === 0) return [];
		const db = this.tables.get(table);
		return Promise.all(keys.map(key => db.get(key).then(JSON.parse)));
	}

	/**
	 * Get all document names from a directory.
	 * @param {string} table The name of the directory to fetch from.
	 * @returns {Promise<string[]>}
	 */
	getKeys(table) {
		return new Promise((res) => {
			const db = this.tables.get(table);
			const output = [];
			if (!db) res(output);
			db.keyStream()
				.on('data', key => output.push(key))
				.on('end', () => res(output));
		});
	}

	/**
     * Get a document from a directory.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @returns {Promise<?Object>}
     */
	get(table, document) {
		return this.tables.get(table).get(document);
	}

	/**
     * Check if the document exists.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @returns {Promise<boolean>}
     */
	has(table, document) {
		return Boolean(this.tables.get(table).has(document));
	}

	/**
	 * Update or insert a new value to all entries.
	 * @param {string} table The name of the directory.
	 * @param {string} path The key's path to update.
	 * @param {*} newValue The new value for the key.
	 */
	async updateValue(table, path, newValue) {
		const route = path.split('.');
		const values = await this.getAll(table);
		await Promise.all(values.map(object => this._updateValue(table, route, object, newValue)));
	}

	/**
	 * Remove a value or object from all entries.
	 * @param {string} table The name of the directory.
	 * @param {string} [path=false] The key's path to update.
	 */
	async removeValue(table, path) {
		const route = path.split('.');
		const values = await this.getAll(table);
		await Promise.all(values.map(object => this._removeValue(table, route, object)));
	}

	/**
     * Insert a new document into a directory.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @param {Object} [data={}] The object with all properties you want to insert into the document.
     * @returns {Promise<void>}
     */
	create(table, document, data = {}) {
		return this.tables.get(table).put(document, JSON.stringify(Object.assign(data, { id: document })));
	}

	set(...args) {
		return this.create(...args);
	}

	insert(...args) {
		return this.create(...args);
	}

	/**
     * Update a document from a directory.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @param {Object} data The object with all the properties you want to update.
     * @returns {Promise<void>}
     */
	async update(table, document, data) {
		const existent = await this.get(table, document);
		return this.set(table, document, Object.assign(existent || { id: document }, data));
	}

	/**
     * Replace all the data from a document.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @param {Object} data The new data for the document.
     * @returns {Promise<void>}
     */
	replace(table, document, data) {
		return this.set(table, document, data);
	}

	/**
     * Delete a document from the table.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @returns {Promise<void>}
     */
	delete(table, document) {
		return this.get(table, document)
			.then(db => db.delete(document));
	}

	/**
	 * Update or insert a new value to a specified entry.
	 * @param {string} table The name of the directory.
	 * @param {string[]} route An array with the path to update.
	 * @param {Object} object The entry to update.
	 * @param {*} newValue The new value for the key.
	 * @returns {Promise<void>}
	 * @private
	 */
	_updateValue(table, route, object, newValue) {
		let value = object;
		for (let j = 0; j < route.length - 1; j++) {
			if (typeof value[route[j]] === 'undefined') value[route[j]] = { [route[j + 1]]: {} };
			value = value[route[j]];
		}
		value[route[route.length - 1]] = newValue;
		return this.replace(table, object.id, object);
	}

	/**
	 * Remove a value from a specified entry.
	 * @param {string} table The name of the directory.
	 * @param {string[]} route An array with the path to update.
	 * @param {Object} object The entry to update.
	 * @returns {Promise<void>}
	 * @private
	 */
	_removeValue(table, route, object) {
		let value = object;
		for (let j = 0; j < route.length - 1; j++) value = value[route[j]] || {};
		delete value[route[route.length - 1]];
		return this.replace(table, object.id, object);
	}

};
