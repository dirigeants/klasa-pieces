const { Provider, util } = require('klasa');
const { v1: neo4j } = require('neo4j-driver');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.db = null;
	}

	init() {
		const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'test'));
		this.db = driver.session();
	}

	/**
	 * Checks if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.db.run(`MATCH (n:${table}) RETURN n`).then(data => Boolean(data.records.length));
	}

	/**
	 * Create a collection within a DB. Options may be specfied, refer to Neo4j docs.
	 * @param {string} table Name of the Collection to crate
	 * @returns {Promise<*>} Returns a promise containing the created Collection.
	 */
	createTable(table) {
		return this.db.run(`CREATE (n:${table}) RETURN n`).then(data => data.records.map(node => node._fields[0].identity.low))[0];
	}

	/**
	 * Drops a collection within a DB.
	 * @param {string} table Name of the collection to drop.
	 * @returns {Promise<void>}
	 */
	deleteTable(table) {
		return this.db.run(`MATCH (n:${table}) DELETE n`);
	}

	/**
	 * Retrieves all Documents in a collection.
	 * @param {string} table Name of the Collection
	 * @returns {Promise<Array>}
	 */
	getAll(table) {
		return this.db.run(`MATCH (n:${table}) RETURN n`).then(data => data.records.map(node => node._fields[0].properties));
	}

	/**
	 * Retrives all the keys in a collection.
	 * @param {string} table The name of the table you want to get the data from.
	 * @returns {Promise<string[]>}
	 */
	getKeys(table) {
		return this.db.run(`MATCH (n:${table}) RETURN n`).then(data => data.records.map(node => node._fields[0].identity.low));
	}

	/**
	 * Retrieves a single Document from a Collection that matches a user determined ID
	 * @param {string} table Name of the Collection
	 * @param {string|Object} id ID of the document
	 * @returns {Promise<*>}
	 */
	get(table, id) {
		return this.db.run(`MATCH (n:${table} {id: {id} }) RETURN n`, { id }).then(data => data.records.map(node => this.packData(node._fields[0].properties, node._fields[0].identity.low))[0]);
	}

	/**
	 * Checks if a document from a Collection exists.
	 * @param {string} table Name of the Collection
	 * @param {string} id ID of the document
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.db.run(`MATCH (n:${table} {id: {id} }) RETURN n`, { id }).then(data => Boolean(data.records.length));
	}

	/**
	 * Inserts a Document into a Collection using a user provided object.
	 * @param {string} table Name of the Collection
	 * @param {(string|Object)} id ID of the document
	 * @param {Object} doc Document Object to insert
	 * @returns {Promise<Object>}
	 */
	create(table, id, doc = {}) {
		return this.db.run(`CREATE (n:${table} ${JSON.stringify({ id, ...this.parseUpdateInput(doc) }).replace(/"([^"]+)":/g, '$1:')}) RETURN n`);
	}

	/**
	 * Updates a Document using Neo4j Update Operators. *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {Object} doc The update operations to be applied to the document
	 * @returns {Promise<void>}
	 */
	update(table, id, doc) {
		const object = this.constructFlatObject(this.parseUpdateInput(doc));
		return this.db.run(`MATCH (n:${table} {id : {id} }) SET ${object} RETURN n`, { id });
	}

	/**
	 * Deletes a Document from a Collection that matches a user determined ID *
	 * @param {string} table Name of the Collection
	 * @param {string} id ID of the document
	 * @returns {Promise<void>}
	 */
	delete(table, id) {
		return this.db.run(`MATCH (n:${table} {id: {id} }) DELETE n`, { id });
	}

	/**
	 * Replaces a Document with a new Document specified by the user *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {Object} doc The Document that replaces the matching document
	 * @returns {Promise<void>}
	 */
	async replace(table, id, doc) {
		const { data } = await this.get(table, id);
		const object = this.constructFlatObject(util.mergeObjects(data, this.parseUpdateInput(doc)));
		return this.db.run(`MATCH (n:${table} {id : {id} }) SET ${object} RETURN n`, { id });
	}

	/**
	 * Update or insert a new value to all entries.
	 * @param {string} table The name of the table.
	 * @param {string} path The object to remove or a path to update.
	 * @param {*} newValue The new value for the key.
    */
	async updateValue(table, path, newValue) {
		const keys = await this.getKeys(table);
		if (util.isObject(path) && typeof newValue === 'undefined') {
			Promise.all(keys.map(async node => await this.updatebyID(table, node, path)));
		} else if (typeof path === 'string' && typeof newValue !== 'undefined') {
			Promise.all(keys.map(async node => await this.updatebyID(table, node, util.makeObject(path, newValue))));
		} else {
			throw new TypeError(`Expected an object as first parameter or a string and a non-undefined value. Got: ${typeof key} and ${typeof value}`);
		}
	}
	/**
	 * Remove a value or object from all entries.
	 * @param {string} table The name of the table.
	 * @param {string} path The object to remove or a path to update.
	 */
	async removeValue(table, path) {
		const keys = await this.getKeys(table);
		if (util.isObject(path) && typeof newValue === 'undefined') {
			Promise.all(keys.map(node => this.remove(table, node, path)));
		} else if (typeof path === 'string' && typeof newValue !== 'undefined') {
			Promise.all(keys.map(node => this.remove(table, node, util.makeObject(path, null))));
		} else {
			throw new TypeError(`Expected an object as first parameter or a string and a non-undefined value. Got: ${typeof key} and ${typeof value}`);
		}
	}
	/**
	 * Deletes a Document from a Collection that matches a user determined ID *
	 * @param {string} table Name of the Collection
	 * @param {string} id ID of the document
	 * @param {string} path Object to be removed
     * @private
	 */
	async remove(table, id, path) {
		const [entry] = this.db.run(`MATCH (n:${table} {id: {id} }) RETURN n`, { id }).then(data => data.records.map(node => node._fields[0].properties));
		delete entry[[Object.keys(path)]];
		await this.updatebyID(table, id, entry);
	}

	/**
	 * Updates a Document using ID assigned by Neo *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {Object} doc The update operations to be applied to the document
	 * @returns {Promise<void>}
	 */
	updatebyID(table, id, doc) {
		const object = this.constructFlatObject(this.parseUpdateInput(doc));
		return this.db.run(`MATCH (n:${table}) WHERE ID(n) = ${id} SET ${object} RETURN n`);
	}

	/**
     * Flattes the Object into a string, to be parsed by Cypher.
     * @private
     * @param {Object} object The Object to be flattened
     * @returns {string}
     * @private
     */
	constructFlatObject(object) {
		const { length } = Object.keys(object);
		let string = '', count = 0;
		for (let [key, value] of Object.entries(object)) { // eslint-disable-line
			if (util.isObject(value)) value = JSON.stringify(value).replace(/"([^"]+)":/g, '$1:');
			string += `n.${key} = ${typeof string === 'string' ? `'${value}'` : value}${length - count++ === 1 ? '' : ','}`;
		}
		return string;
	}

	/**
     * Packs the data into easy-to-use manner
     * @param {*} data :)
     * @param {*} id   (:
     * @returns {Object}
     * @private
     */
	packData(data, id) {
		return {
			data,
			uuid: id
		};
	}

};

