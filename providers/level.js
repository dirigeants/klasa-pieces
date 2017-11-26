const { Provider } = require('klasa');
const { sep, resolve } = require('path');
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
		this.loaded = new Collection();
	}

	async init() {
		await fs.ensureDir(this.baseDir).catch(err => this.client.emit('log', err, 'error'));
		const files = await fs.readdir(this.baseDir).catch(err => this.client.emit('log', err, 'error'));
		files.map(file => {
			const db = new Level(this.baseDir + sep + file);
			return this.loaded.set(file, db);
		});
	}

	/* Table methods */

	/**
     * Checks if a directory exists.
     * @param {string} table The name of the table you want to check.
     * @returns {Promise<boolean>}
     */
	hasTable(table) {
		return this.loaded.has(table);
	}

	/**
     * Creates a new directory.
     * @param {string} table The name for the new directory.
     * @returns {Promise<Void>}
     */
	createTable(table) {
		const db = new Level(this.baseDir + sep + table);
		return this.loaded.set(table, db);
	}

	/**
     * Recursively deletes a directory.
     * @param {string} table The directory's name to delete.
     * @returns {Promise<Void>}
     */
	deleteTable(table) {
		if (!this.hasTable(table)) return Promise.resolve();
		const db = this.loaded.get(table);
		return db.destroy();
	}

	/* Document methods */

	/**
     * Get all documents from a directory.
     * @param {string} table The name of the directory to fetch from.
     * @returns {Promise<Object[]>}
     */
	getAll(table) {
		return new Promise((res) => {
			const db = this.loaded.get(table);
			const output = [];
			if (!db) res(output);
			db.keyStream()
				.on('data', key => db.get(key).then(data => output.push(JSON.parse(data))))
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
		return this.loaded.get(table).get(document);
	}

	/**
     * Check if the document exists.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @returns {Promise<boolean>}
     */
	has(table, document) {
		return !!this.loaded.get(table).has(document);
	}

	/**
     * Insert a new document into a directory.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @param {Object} data The object with all properties you want to insert into the document.
     * @returns {Promise<Void>}
     */
	create(table, document, data) {
		console.log(`Inserting ${document} with data: ${data}`);
		return this.loaded.get(table).put(document, JSON.stringify(Object.assign(data, { id: document })));
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
     * @returns {Promise<Void>}
     */
	update(table, document, data) {
		return this.get(table, document)
			.then(current => this.set(table, document, Object.assign(current, data)));
	}

	/**
     * Replace all the data from a document.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @param {Object} data The new data for the document.
     * @returns {Promise<Void>}
     */
	replace(table, document, data) {
		return this.set(table, document, data);
	}

	/**
     * Delete a document from the table.
     * @param {string} table The name of the directory.
     * @param {string} document The document name.
     * @returns {Promise<Void>}
     */
	delete(table, document) {
		return this.get(table, document)
			.then(db => db.delete(document));
	}

	shutdown() {
		return this.loaded.forEach(db => db.close());
	}

};
