/*
	1. Go to https://firebase.google.com/
	2. Login/Signup
	3. Go to Console
	4. Create new project
	5. Go to the database section
	6. Select Firestore. NOTE- Don't select Real time database
	7. Then in the LHS of the page, finda settings icon next to Project Overview, select Project settings.
	8. Go to service accounts
	9. Click Generate new private key, which will download a json file.
	10. Copy the databaseURL from the same page.
	11. Import the json, where ever you are initializing the client.
	12. Pass this to the constructor, providers: { default: 'firestore', firestore: { credentials: variable_name_for_json, databaseURL: 'databaseURL from the service account page.'}}
	13. Download the `firebase-admin` module.
*/

const { Provider } = require('klasa');
const firebase = require('firebase-admin');
const { FieldValue } = firebase;

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.db = null;
	}
	/**
	 * Initiaizes the firestore
	 * @private
	 */
	async init() {
		await firebase.initializeApp({
			credential: firebase.credential.cert(this.client.options.providers.firestore.credentials),
			databaseURL: this.client.options.providers.firestore.databaseURL
		});

		this.db = firebase.firestore();
	}
	/**
	 *Checks if the table/collection exists
	 * @param {string} table The name of the table/collection to be checked for existance
	 * @returns {Promise<boolean>}
	 */
	hasTable(table) {
		return this.db.collection(table).get().then(col => !!col.size);
	}

	/**
	 * This method is a dummy method, as new tables/collections are automatically created by firestore when needed.
	 * @param {string} table Name of the collection to create.
	 * @returns {Promise<Collection>}
	 */
	createTable(table) {
		return this.db.collection(table);
	}

	/**
	 * Returns all the documents of a collection
	 * @param {string} table Name of the collection, for which all values is to be returned
	 * @returns {Promise<Array>}
	 */
	getAll(table) {
		return this.db.collection(table).get().then(snaps => snaps.docs.map(snap => snap.data()));
	}
	/**
	 * Returns all the Keys/Docs of a collection/tanle.
	 * @param {string} table Name of the collection/table for which all Keys/Docs is to be returned.
	 * @returns {Promise<Array>}
	 */
	getKeys(table) {
		return this.db.collection(table).get().then(snaps => snaps.docs.map(snap => snap.id));
	}
	/**
	 * Returns a particular Document from the table/Collection.
	 * @param {string} table Name of the collection/Table to get the value from
	 * @param {string} id Name of the Document/Key to be returned
	 * @returns {Promise<Any>}
	 */
	get(table, id) {
		return this.db.collection(table).doc(id).get();
	}

	/**
	 * Checks if a collection has a particular Document/Key
	 * @param {string} table Name of the collection/Table
	 * @param {string} id Name of the Document/Key
	 * @returns {Promise<boolean>}
	 */
	has(table, id) {
		return this.db.collection(table).doc(id).get().then(data => data.exists);
	}

	/**
	 * Creates a new Document/Field in a collection.
	 * @param {string} table Name of the collection/table
	 * @param {string} id Name of they Docment/Key
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} doc the object you want to insert in the table.
	 * @returns {Promise<DocumentObject>}
	 */
	create(table, id, doc = {}) {
		return this.db.collection(table).doc(id).set(this.parseUpdateInput(doc));
	}

	/**
	 * Updates the values of a Document/Field
	 * @param {string} table Name of the Collection that contains the Document
	 * @param {string} id  Name of the Document/field
	 * @param {(ConfigurationUpdateResultEntry[] | [string, any][] | Object<string, *>)} doc the object you want to insert in the table.
	 * @returns {Promise<WriteResult>}
	 */
	update(table, id, doc) {
		return this.db.collection(table).doc(id).update(this.parseUpdateInput(doc));
	}

	/**
	 * Deleted a particular Document/Field from the Collection/Table
	 * @param {string} table Name of the collection/table
	 * @param {string} id Name of the Document/Key to delete
	 * @returns {Promise<WriteResult>}
	 */
	async delete(table, id) {
		return await this.db.collection(table).doc(id).delete();
	}
	/**
	 * Replaces a Document with a new Document specified by the user *
	 * @param {string} table Name of the Collection
	 * @param {Object} id The Filter used to select the document to update
	 * @param {Object} [doc={}] The Document that replaces the matching document
	 * @returns {Promise}
	 */
	replace(...args) {
		return this.create(...args);
	}

	/**
	 * Update or insert a new value to all entries
	 * @param {string} table Name of the Collectiom
	 * @param {string} path The Field to be updated in al the Documents
	 * @param {*} newValue The value to to updated in all the Documents
	 */
	async updateValue(table, path, newValue) {
		const keys = await this.getKeys(table);

		if (typeof path === 'object' && typeof newValue === 'undefined') {
			await Promise.all(keys.map(doc => this.update(table, doc, path)));
		}

		else if (typeof path === 'string' && typeof newValue !== 'undefined') {
			await Promise.all(keys.map(doc => this.update(table, doc, { path: newValue })));
		}

		else throw new TypeError(`Expected an object as first parameter or a string and a non-undefined value. Got: ${typeof key} and ${typeof value}`);
	}

	/**
	 * Remove a value or object from all entries.
	 * @param {string} table Name of the Collection
	 * @param {string} path The Field to be updated in al the Documents
	 * @param {*} newValue The value to to updated in all the Documents
	 */
	async removeValue(table, path) {
		const keys = await this.getKeys(table);
		if (typeof path === 'object' && typeof newValue === 'undefined') {
			for (const key of Object.keys(path)) path[key] = FieldValue.deleteValue();
			await Promise.all(keys.map(doc => this.update(table, doc, path)));
		}

		else if (typeof path === 'string' && typeof newValue !== 'undefined') {
			await Promise.all(keys.map(doc => this.update(table, doc, { path: FieldValue.deleteValue() })));
		}

		else throw new TypeError(`Expected an object as first parameter or a string and a non-undefined value. Got: ${typeof key} and ${typeof value}`);
	}

};

