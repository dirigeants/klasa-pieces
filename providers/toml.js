const TOML = require('@iarna/toml');
const fs = require('fs-nextra');
const { Provider, util } = require('klasa');
const { resolve } = require('path');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);

		const baseDirectory = resolve(this.client.userBaseDirectory, 'bwd', 'provider', 'toml');
		const defaults = util.mergeDefault({ baseDirectory }, this.client.options.providers.toml);
		this.baseDirectory = defaults.baseDirectory;
	}

	async init() {
		await fs.ensureDir(this.baseDirectory).catch(err => this.client.emit('error', err));
	}

	hasTable(table) {
		return fs.pathExists(resolve(this.baseDirectory, table));
	}

	createTable(table) {
		return fs.mkdir(resolve(this.baseDirectory, table));
	}

	deleteTable(table) {
		return this.hasTable(table)
			.then(exists => exists ? fs.emptyDir(resolve(this.baseDirectory, table)).then(() => fs.remove(resolve(this.baseDirectory, table))) : null);
	}

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
		const filenames = await fs.readdir(dir);
		const files = [];
		for (const filename of filenames) {
			if (filename.endsWith('.toml')) files.push(filename.slice(0, filename.length - 5));
		}
		return files;
	}

	get(table, id) {
		return fs.readFile(resolve(this.baseDirectory, table, `${id}.toml`))
			.then(buffer => TOML.parse(buffer.toString('utf8').replace(/^\uFEFF/, ''))).catch(() => null);
	}

	has(table, id) {
		return fs.pathExists(resolve(this.baseDirectory, table, `${id}.toml`));
	}

	getRandom(table) {
		return this.getKeys(table).then(data => this.get(table, data[Math.floor(Math.random() * data.length)]));
	}

	create(table, id, data = {}) {
		return fs.outputFileAtomic(resolve(this.baseDirectory, table, `${id}.toml`), TOML.stringify({ id, ...this.parseUpdateInput(data) }));
	}

	async update(table, id, data) {
		const existent = await this.get(table, id);
		return fs.outputFileAtomic(resolve(this.baseDirectory, table, `${id}.toml`), TOML.stringify(util.mergeObjects(existent || { id }, this.parseUpdateInput(data))));
	}

	replace(table, id, data) {
		return fs.outputFileAtomic(resolve(this.baseDirectory, table, `${id}.toml`, TOML.stringify({ id, ...this.parseUpdateInput(data) })));
	}

	delete(table, id) {
		return fs.unlink(resolve(this.baseDirectory, table, `${id}.toml`));
	}

};
