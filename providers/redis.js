const { Provider } = require('klasa');
const { Client } = require('redis-nextra');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, { description: 'Allows you use Redis functionality throughout Klasa.' });
		this.db = null;
	}


	async init() {
		this.db = new Client('localhost', this.client.options.providers.redis)
			.on('ready', this.client.console.log('Redis connected'))
			.on('serverReconnect', server => this.client.console.warn(`Redis server ${server.host.string} is reconnecting`))
			.on('error', error => this.client.emit('error', error));
	}

	get exec() {
		return this.db;
	}

	/* Table methods */

	hasTable(table) {
		return this.db.tables.has(table);
	}

	createTable(table) {
		return this.db.createTable(table);
	}

	deleteTable(table) {
		return this.db.deleteTable(table);
	}

	/* Document methods */

	getAll(table) {
		return this.db.table(table).valuesJson('*');
	}

	get(table, id) {
		return this.db.table(table).getJson(id);
	}

	has(table, id) {
		return this.db.table(table).has(id);
	}

	getRandom(table) {
		const items = this.getAll(table);
		return items[Math.floor(Math.random() * items.length)];
	}

	set(table, id, value, timer = 0) {
		return this.db.table(table).setJson(id, value, timer);
	}

	delete(table, id) {
		return this.db.table(table).del(id);
	}

};
