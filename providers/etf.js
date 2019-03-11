// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Provider, util } = require('klasa');
// Requires to be installed from https://github.com/devsnek/earl
const { pack, unpack } = require('earl');
const { resolve } = require('path');
const fsn = require('fs-nextra');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);

		const baseDirectory = resolve(this.client.userBaseDirectory, 'bwd', 'provider', 'etf');
		const defaults = util.mergeDefault({ baseDirectory }, this.client.options.providers.etf);

		this.baseDirectory = defaults.baseDirectory;
	}

	async init() {
		await fsn.ensureDir(this.baseDirectory).catch(err => this.client.emit('error', err));
	}

	/* Table methods */
	hasTable(table) {
		return fsn.pathExists(resolve(this.baseDirectory, table));
	}

	createTable(table) {
		return fsn.mkdir(resolve(this.baseDirectory, table));
	}

	deleteTable(table) {
		return this.hasTable(table)
			.then(exists => exists ? fsn.emptyDir(resolve(this.baseDirectory, table))
				.then(() => fsn.remove(resolve(this.baseDirectory, table))) : null);
	}

	/* Document methods */

	async getAll(table, entries) {
		if (!Array.isArray(entries) || !entries.length) entries = await this.getKeys(table);
		if (entries.length < 5000) {
			return Promise.all(entries.map(this.get.bind(this, table)));
		}

		const chunks = util.chunk(entries, 5000);
		const output = [];
		for (const chunk of chunks) output.push(...await Promise.all(chunk.map(this.get.bind(this, table))));
		return output;
	}

	async getKeys(table) {
		const dir = resolve(this.baseDirectory, table);
		const filenames = await fsn.readdir(dir);
		const files = [];
		for (const filename of filenames) {
			if (filename.endsWith('.etf')) files.push(filename.slice(0, filename.length - 4));
		}
		return files;
	}

	get(table, id) {
		return fsn.readFile(resolve(this.baseDirectory, table, `${id}.etf`))
			.then(unpack)
			.catch(() => null);
	}

	has(table, id) {
		return fsn.pathExists(resolve(this.baseDirectory, table, `${id}.etf`));
	}

	getRandom(table) {
		return this.getKeys(table).then(data => data.length ? this.get(table, data[Math.floor(Math.random() * data.length)]) : null);
	}

	create(table, id, data = {}) {
		return fsn.outputFileAtomic(resolve(this.baseDirectory, table, `${id}.etf`), pack({ id, ...this.parseUpdateInput(data) }));
	}

	async update(table, id, data) {
		const existent = await this.get(table, id);
		return fsn.outputFileAtomic(resolve(this.baseDirectory, table, `${id}.etf`), pack(util.mergeObjects(existent || { id }, this.parseUpdateInput(data))));
	}

	replace(table, id, data) {
		return fsn.outputFileAtomic(resolve(this.baseDirectory, table, `${id}.etf`), pack({ id, ...this.parseUpdateInput(data) }));
	}

	delete(table, id) {
		return fsn.unlink(resolve(this.baseDirectory, table, `${id}.etf`));
	}

};
