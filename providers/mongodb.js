const { Provider, util: { mergeDefault, mergeObjects, isObject } } = require('klasa');

const { MongoClient: Mongo } = require('mongodb');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, { description: 'Allows use of MongoDB functionality throughout Klasa' });
		this.db = null;
	}

	async init() {
		const connection = mergeDefault({
			host: 'localhost',
			port: 27017,
			db: 'klasa',
			options: {}
		}, this.client.options.providers.mongodb);
		const mongoClient = await Mongo.connect(`mongodb://${connection.host}:${connection.port}/`, mergeObjects(connection.options, {
			auth: {
				user: connection.user,
				password: connection.password
			}
		}));
		this.db = mongoClient.db(connection.db);
	}

	/* Table methods */

	get exec() {
		return this.db;
	}

	/**
	 * Checks if a table exists.
	 * @param {string} table The name of the table you want to check.
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.db.listCollections().toArray().then(collections => collections.some(col => col.name === table));
	}

	/**
	 * Create a collection within a DB. Options may be specfied, refer to MongoDB docs.
	 * @param {string} table Name of the Collection to crate
	 * @returns {Promise<Collection>} Returns a promise containing the created Collection.
	 */
	createTable(table) {
		return this.db.createCollection(table);
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
	getAll(table, filter = []) {
		if (filter.length) return this.db.collection(table).find({ id: { $in: filter } }, { _id: 0 }).toArray();
		return this.db.collection(table).find({}, { _id: 0 }).toArray();
	}

	/**
	 *
	 * @param {string} table The name of the table you want to get the data from.
	 * @returns {Promise<string[]>}
	 */
	getKeys(table) {
		return this.db.collection(table).find({}, { id: 1, _id: 0 }).toArray();
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
		return this.get(table, id).then(Boolean);
	}

	/**
	 * Get a random value from a Collection.
	 * @param {string} table Name of the Collection
	 * @returns {Promise<Object>}
	 */
	getRandom(table) {
		return this.getKeys(table).then(results => this.get(table, results[Math.floor(Math.random() * results.length)].id));
	}

	/**
	 * Update or insert a new value to all entries.
	 * @param {string} table The name of the table.
	 * @param {string} path The object to remove or a path to update.
	 * @param {*} newValue The new value for the key.
	 * @returns {Promise<Object>}
	 * @example
	 * // Editing a single value
	 * // You can edit a single value in a very similar way to Gateway#updateOne.
	 * updateValue('339942739275677727', 'channels.modlogs', '340713281972862976');
	 *
	 * // However, you can also update it by passing an object.
	 * updateValue('339942739275677727', { channels: { modlogs: '340713281972862976' } });
	 *
	 * // Editing multiple values
	 * // As MongoDB#update can also work very similar to Gateway#updateMany, it also accepts an entire object with multiple values.
	 * updateValue('339942739275677727', { prefix: 'k!', roles: { administrator: '339959033937264641' } });
	 */
	async updateValue(table, path, newValue) {
		// { channels: { modlog: '340713281972862976' } } | undefined
		if (typeof path === 'object' && typeof newValue === 'undefined') {
			return this.db.collection(table).update({}, { $set: path }, { multi: true });
		}
		// 'channels.modlog' | '340713281972862976'
		if (typeof path === 'string' && typeof newValue !== 'undefined') {
			const route = path.split('.');
			const object = {};
			let ref = object;
			for (let i = 0; i < route.length - 1; i++) ref = ref[route[i]] = {};
			ref[route[route.length - 1]] = newValue;
			return this.db.collection(table).update({}, { $set: object }, { multi: true });
		}
		throw new TypeError(`Expected an object as first parameter or a string and a non-undefined value. Got: ${typeof key} and ${typeof value}`);
	}

	/**
	 * Remove a value or object from all entries.
	 * @param {string} table The name of the table.
	 * @param {string} doc The object to remove or a path to update.
	 * @returns {Promise<Object>}
	 */
	async removeValue(table, doc) {
		// { channels: { modlog: true } }
		if (typeof doc === 'object') {
			return this.db.table(table).update({}, { $unset: doc }, { multi: true });
		}
		// 'channels.modlog'
		if (typeof doc === 'string') {
			const route = doc.split('.');
			const object = {};
			let ref = object;
			for (let i = 0; i < route.length - 1; i++) ref = ref[route[i]] = {};
			ref[route[route.length - 1]] = true;
			return this.db.table(table).update({}, { $unset: object }, { multi: true });
		}
		throw new TypeError(`Expected an object or a string as first parameter. Got: ${typeof doc}`);
	}

	/**
	 * Inserts a Document into a Collection using a user provided object.
	 * @param {string} table Name of the Collection
	 * @param {(string|Object)} id ID of the document
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} doc Document Object to insert
	 * @returns {Promise}
	 */
	create(table, id, doc = {}) {
		return this.db.collection(table).insertOne(mergeObjects(this.parseUpdateInput(doc), resolveQuery(id)));
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
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} doc The update operations to be applied to the document
	 * @returns {Promise<void>}
	 */
	update(table, id, doc) {
		return this.db.collection(table).updateOne(resolveQuery(id), { $set: this.parseUpdateInput(doc) });
	}

	/**
	 * Replaces a Document with a new Document specified by the user *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} doc The Document that replaces the matching document
	 * @returns {Promise<void>}
	 */
	replace(table, id, doc) {
		return this.db.collection(table).replaceOne(resolveQuery(id), this.parseUpdateInput(doc));
	}

};

const resolveQuery = query => isObject(query) ? query : { id: query };
