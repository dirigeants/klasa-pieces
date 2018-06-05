const { Provider, Type, util: { mergeDefault, isObject, makeObject, chunk } } = require('klasa');
const { r } = require('rebirthdbts'); // eslint-disable-line id-length

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.db = r;
		this.pool = null;
	}

	async init() {
		this.pool = await r.connectPool(mergeDefault({
			db: 'test',
			silent: false
		}, this.client.options.providers.rebirthdb));
	}

	get exec() {
		return this.db;
	}

	async ping() {
		const now = Date.now();
		return await this.db.now() - now;
	}

	/* Table methods */

	hasTable(table) {
		return this.db.tableList().contains(table).run();
	}

	createTable(table) {
		return this.db.tableCreate(table).run();
	}

	deleteTable(table) {
		return this.db.tableDrop(table).run();
	}

	sync(table) {
		return this.db.table(table).sync().run();
	}

	/* Document methods */

	async getAll(table, entries = []) {
		if (entries.length) {
			const chunks = chunk(entries, 50000);
			const output = [];
			for (const myChunk of chunks) output.push(...await this.db.table(table).getAll(...myChunk).run());
			return output;
		}
		return this.db.table(table).run();
	}

	async getKeys(table, entries = []) {
		if (entries.length) {
			const chunks = chunk(entries, 50000);
			const output = [];
			for (const myChunk of chunks) output.push(...await this.db.table(table).getAll(...myChunk)('id').run());
			return output;
		}
		return this.db.table(table)('id').run();
	}

	get(table, id) {
		return this.db.table(table).get(id).run();
	}

	has(table, id) {
		return this.db.table(table).get(id).ne(null).run();
	}

	getRandom(table) {
		return this.db.table(table).sample(1).run();
	}

	create(table, id, value = {}) {
		return this.db.table(table).insert({ ...this.parseUpdateInput(value), id }).run();
	}

	update(table, id, value = {}) {
		return this.db.table(table).get(id).update(this.parseUpdateInput(value)).run();
	}

	replace(table, id, value = {}) {
		return this.db.table(table).get(id).replace({ ...this.parseUpdateInput(value), id }).run();
	}

	delete(table, id) {
		return this.db.table(table).get(id).delete().run();
	}

	removeValue(table, path) {
		// { channels: { modlog: true } }
		if (isObject(path)) {
			return this.db.table(table).replace(row => row.without(path)).run();
		}

		// 'channels.modlog'
		if (typeof path === 'string') {
			const rPath = makeObject(path, true);
			return this.db.table(table).replace(row => row.without(rPath)).run();
		}

		return Promise.reject(new TypeError(`Expected an object or a string as first parameter. Got: ${new Type(path)}`));
	}

};
