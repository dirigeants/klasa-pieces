const { Provider } = require('klasa');
const rethink = require('rethinkdbdash');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.db = rethink({ db: 'test' });
	}

	/* Table methods */

	get exec() {
		return this.db;
	}

	/**
	 * Checks if the table exists.
	 * @param {string} table the name of the table you want to check.
	 * @returns {boolean}
	 */
	hasTable(table) {
		return this.db.tableList().run().then(data => data.includes(table));
	}

	/**
	 * Creates a new table.
	 * @param {string} table the name for the new table.
	 * @returns {Object}
	 */
	createTable(table) {
		return this.db.tableCreate(table).run();
	}

	/**
	 * Deletes a table.
	 * @param {string} table the name of the table you want to drop.
	 * @returns {Object}
	 */
	deleteTable(table) {
		return this.db.tableDrop(table).run();
	}

	/**
	 * Sync the database.
	 * @param {string} table the name of the table you want to sync.
	 * @returns {Object}
	 */
	sync(table) {
		return this.db.table(table).sync().run();
	}

	/* Document methods */

	/**
	 * Get all entries from a table.
	 * @param {string} table the name of the table you want to get the data from.
	 * @returns {?array}
	 */
	getAll(table) {
		return this.db.table(table) || null;
	}

	/**
	 * Get an entry from a table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @returns {?Object}
	 */
	get(table, id) {
		return this.db.table(table).get(id) || null;
	}

	/**
	 * Check if an entry exists from a table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @returns {boolean}
	 */
	has(table, id) {
		return this.get(table, id).then(data => !!data).catch(() => false);
	}

	/**
	 * Get a random entry from a table.
	 * @param {string} table the name of the table.
	 * @returns {Object}
	 */
	getRandom(table) {
		return this.all(table).then(data => data[Math.floor(Math.random() * data.length)]);
	}

	/**
	 * Insert a new document into a table.
	 * @param {string} table the name of the table.
	 * @param {string} id the id of the record.
	 * @param {Object} doc the object you want to insert in the table.
	 * @returns {Object}
	 */
	create(table, id, doc) {
		return this.db.table(table).insert(Object.assign(doc, { id })).run();
	}

	set(...args) {
		return this.create(...args);
	}

	insert(...args) {
		return this.create(...args);
	}

	/**
	 * Update a document from a table given its ID.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {Object} doc the object you want to insert in the table.
	 * @returns {Object}
	 */
	update(table, id, doc) {
		return this.db.table(table).get(id).update(doc).run();
	}

	/**
	 * Replace the object from an entry with another.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {Object} doc the document in question to replace the current entry's properties.
	 * @returns {Object}
	 */
	replace(table, id, doc) {
		return this.db.table(table).get(id).replace(doc).run();
	}

	/**
	 * Delete an entry from the table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @returns {Object}
	 */
	delete(table, id) {
		return this.db.table(table).get(id).delete().run();
	}

	/**
	 * Insert an object into an array given the name of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {Object} doc the object you want to insert in the table.
	 * @returns {Object}
	 */
	append(table, id, uArray, doc) {
		return this.db.table(table).get(id).update(object => ({ [uArray]: object(uArray).default([]).append(doc) })).run();
	}

	/**
	 * Update an object into an array given the position of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {number} index the position of the object inside the array.
	 * @param {Object} doc the object you want to insert in the table.
	 * @returns {Object}
	 */
	updateArrayByIndex(table, id, uArray, index, doc) {
		return this.db.table(table).get(id).update({ [uArray]: this.db.row(uArray).changeAt(index, this.db.row(uArray).nth(index).merge(doc)) }).run();
	}

	/**
	 * Update an object into an array given the ID, the name of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {string} index the ID of the object inside the array.
	 * @param {Object} doc the object you want to insert in the table.
	 * @returns {Object}
	 */
	updateArrayByID(table, id, uArray, index, doc) {
		return this.db.table(table).get(id).update({ [uArray]: this.db.row(uArray).map(da => this.db.branch(da('id').eq(index), da.merge(doc), da)) }).run();
	}

	/**
	 * Remove an object from an array given the position of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {number} index the position of the object inside the array.
	 * @returns {Object}
	 */
	removeFromArrayByIndex(table, id, uArray, index) {
		return this.db.table(table).get(id).update({ [uArray]: this.db.row(uArray).deleteAt(index) }).run();
	}

	/**
	 * Remove an object from an array given the position of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {string} index the ID of the object inside the array.
	 * @returns {Object}
	 */
	removeFromArrayByID(table, id, uArray, index) {
		return this.db.table(table).get(id).update({ [uArray]: this.db.row(uArray).filter(it => it('id').ne(index)) }).run();
	}

	/**
	 * Get an object from an array given the position of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {number} index the position of the object inside the array.
	 * @returns {Object}
	 */
	getFromArrayByIndex(table, id, uArray, index) {
		return this.db.table(table).get(id)(uArray).nth(index).run();
	}

	/**
	 * Get an object into an array given the ID, the name of the array, entry ID and table.
	 * @param {string} table the name of the table.
	 * @param {string|number} id the entry's ID.
	 * @param {string} uArray the name of the array you want to update.
	 * @param {string} index the ID of the object inside the array.
	 * @returns {?Object}
	 */
	getFromArrayByID(table, id, uArray, index) {
		return this.db.table(table).get(id)(uArray).filter(rethink.row('id').eq(index)).run().then(res => res.length ? res[0] : null);
	}

};
