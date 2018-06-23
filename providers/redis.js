const { Provider } = require('klasa');
const { Client } = require('redis-nextra');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args, { enabled: true });

		const { hosts, options } = this.client.providers.redis;
		this.db = new Client(hosts, options);

		this.db.on('ready', () => this.client.emit('debug', 'Redis initialized.'))
			.on('serverReconnect', server => this.client.emit('warn', `Redis server: ${server.host.string} is reconnecting`))
			.on('error', err => this.client.emit('err', err));
	}

	hasTable(table) {
		return this.db.tables.has(table);
	}

	createTable(table) {
		return this.db.createTable(table);
	}

	deleteTable(table) {
		return this.db.deleteTable(table);
	}

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
		return this.db.table(table).srandmember();
	}

	create(table, id, data) {
		return this.db.table(table).setJson(id, data);
	}

	set(...args) {
		return this.create(...args);
	}

	insert(...args) {
		return this.create(...args);
	}

	update(...args) {
		return this.set(...args);
	}

	replace(...args) {
		return this.set(...args);
	}

	delete(table, id) {
		return this.db.table(table).del(id);
	}

};
