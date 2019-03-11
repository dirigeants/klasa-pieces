// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Provider, util } = require('klasa');
const { Client } = require('redis-nextra');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);

		const { hosts, options } = util.mergeDefault(this.client.providers.redis, {
			hosts: ['127.0.0.1:6379'],
			options: {}
		});

		this.db = new Client(hosts, options);

		this.db.on('ready', () => this.client.emit('debug', 'Redis initialized.'))
			.on('serverReconnect', server => this.client.emit('warn', `Redis server: ${server.host.string} is reconnecting.`))
			.on('error', err => this.client.emit('error', err));
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

	async update(table, id, data) {
		const existent = await this.get(table, id);
		return this.create(table, id, util.mergeObjects(existent || { id }, this.parseUpdateInput(data)));
	}

	replace(...args) {
		return this.set(...args);
	}

	delete(table, id) {
		return this.db.table(table).del(id);
	}

};
