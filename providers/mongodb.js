const { Provider } = require('klasa');

const Mongo = require('mongodb').MongoClient;

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, { description: 'Allows use of MongoDB functionality throughout Klasa' });
		this.db = null;
	}

	async init() {
		this.db = await Mongo.connect(`mongodb://localhost:27017/Klasa`);
	}

	/* Table methods */

	/**
	 * Checks if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.db.getCollectionNames()
			.then(collections => collections.includes(table));
	}

	/**
	 * Create a collection within a DB. Options may be specfied, refer to MongoDB docs.
	 * @param {string} table Name of the Collection to crate
	 * @param {Object} [options={}] Object containing various options for the created Collection
	 * @returns {Promise<Collection>} Returns a promise containing the created Collection.
	 */
	createTable(table, options = {}) {
		return this.db.createCollection(table, options);
	}

	createCollection(...args) {
		return this.createTable(...args);
	}

	/**
	 * Drops a collection within a DB.
	 * @param {string} table Name of the collection to drop.
	 * @returns {Promise<boolean>}
	 */
	deleteTable(table) {
		return this.db.dropCollection(table);
	}

	dropCollection(table) {
		return this.deleteTable(table);
	}

	/* Document methods */

	/**
	 * Retrieves all Documents in a collection.
	 * @param {string} table Name of the Collection
	 * @returns {Promise<Array>}
	 */
	async getAll(table) {
		const output = await this.db.collection(table).find({}).toArray();
		for (let i = 0; i < output.length; i++) { delete output[i]._id; }
		return output;
	}

	/**
	 * Retrieves a single Document from a Collection that matches a user determined ID
	 * @param {string} table Name of the Collection
	 * @param {string|Object} id ID of the document
	 * @returns {Promise<?Object>}
	 */
	get(table, id) {
		return this.db.collection(table).findOne(resolveQuery(id));
	}

	/**
	 * Checks if a document from a Collection exists.
	 * @param {string} table Name of the Collection
	 * @param {string|Object} id ID of the document
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.get(table, id).then(res => !!res);
	}

	/**
	 * Get a random value from a Collection.
	 * @param {string} table Name of the Collection
	 * @returns {Promise<Object>}
	 */
	async getRandom(table) {
		const results = await this.getAll(table);
		return results[Math.floor(Math.random() * results.length)];
	}

	/**
	 * Inserts a Document into a Collection using a user provided object.
	 * @param {string} table Name of the Collection
	 * @param {(string|Object)} id ID of the document
	 * @param {Object} doc Document Object to insert
	 * @returns {Promise}
	 */
	create(table, id, doc) {
		return this.db.collection(table).insertOne(Object.assign(doc, resolveQuery(id)));
	}

	set(...args) {
		return this.create(...args);
	}

	insert(...args) {
		return this.create(...args);
	}

	/**
	 * Deletes a Document from a Collection that matches a user determined ID *
	 * @param {string} table Name of the Collection
	 * @param {string} id ID of the document
	 * @returns {Promise<void>}
	 */
	delete(table, id) {
		return this.db.collection(table).deleteOne(resolveQuery(id));
	}

	/**
	 * Updates a Document using MongoDB Update Operators. *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {Object} doc The update operations to be applied to the document
	 * @returns {Promise<void>}
	 */
	async update(table, id, doc) {
		const res = await this.get(table, id);
		return this.db.collection(table).updateOne(resolveQuery(id), Object.assign(res, doc));
	}

	/**
	 * Replaces a Document with a new Document specified by the user *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {Object} doc The Document that replaces the matching document
	 * @returns {Promise<void>}
	 */
	replace(table, id, doc) {
		return this.db.collection(table).replaceOne(resolveQuery(id), doc);
	}

};

const resolveQuery = query => query instanceof Object ? query : { id: query };
