const { Provider, util: { mergeDefault, makeObject, isObject, mergeObjects } } = require('klasa');
const { v1: neo4j } = require('neo4j-driver');

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.db = null;
	}

	init() {
		const { host, username, password } = mergeDefault({
			host: 'bolt://localhost',
			username: 'neo4j',
			password: 'neo4j'
		}, this.client.options.providers.neo4j);

		const driver = neo4j.driver(host, neo4j.auth.basic(username, password));
		this.db = driver.session();
	}

	hasTable(table) {
		return this.db.run(`MATCH (n:${table}) RETURN n`).then(data => Boolean(data.records.length));
	}

	createTable(table) {
		return this.db.run(`CREATE (n:${table}) RETURN n`).then(data => data.records.map(node => node._fields[0].identity.low)[0]);
	}

	deleteTable(table) {
		return this.db.run(`MATCH (n:${table}) DELETE n`);
	}
  
	async getAll(table, filter = []) {
		const result = await this.db.run(`MATCH (n:${table}) RETURN n`)
			.then(data => data.records.map(node => node._fields[0].properties));
		return filter.length ? result.filter(nodes => filter.includes(nodes.id)) : result;
	}

	getKeys(table) {
		return this.db.run(`MATCH (n:${table}) RETURN n`).then(data => data.records.map(node => node._fields[0].identity.low));
	}

	get(table, id) {
		return this.db.run(`MATCH (n:${table}) WHERE n.id = ${typeof id === 'string' ? `'${id}'` : id} RETURN n`)
			.then(data => data.records.map(node => node._fields[0].properties)[0]);
	}

	has(table, id) {
		return this.db.run(`MATCH (n:${table} {id: {id} }) RETURN n`, { id }).then(data => Boolean(data.records.length));
	}

	create(table, id, doc = {}) {
		return this.db.run(`CREATE (n:${table} ${JSON.stringify({ id, ...this.parseUpdateInput(doc) }).replace(/"([^"]+)":/g, '$1:')}) RETURN n`);
	}

	update(table, id, doc) {
		const object = this.constructFlatObject(this.parseUpdateInput(doc));
		return this.db.run(`MATCH (n:${table} {id : {id} }) SET ${object} RETURN n`, { id });
	}

	delete(table, id) {
		return this.db.run(`MATCH (n:${table} {id: {id} }) DELETE n`, { id });
	}

	updatebyID(table, id, doc) {
		const object = this.constructFlatObject(this.parseUpdateInput(doc));
		return this.db.run(`MATCH (n:${table}) WHERE ID(n) = ${id} SET ${object} RETURN n`);
	}

	constructFlatObject(object) {
		const string = [];
		Object.entries(object).map(([key, value]) => {
			if (isObject(object)) value = JSON.stringify(value).replace(/"([^"]+)":/g, '$1:');
			return string.push(`n.${key} = ${typeof string === 'string' ? `'${value}'` : value}`);
		});
		return string.join(', ');
	}

<<<<<<< HEAD
	async getAll(table, filter = []) {
		return await this.db.run(`MATCH (n:${table}) ${filter.length ? `WHERE n.id IN ${filter}` : ''}RETURN n`)
			.then(data => data.records.map(node => node._fields[0].properties));
	}

=======
>>>>>>> SGv2.2.0
	async replace(table, id, doc) {
		const { data } = await this.get(table, id);
		const object = this.constructFlatObject(mergeObjects(data, this.parseUpdateInput(doc)));
		return this.db.run(`MATCH (n:${table} {id : {id} }) SET ${object} RETURN n`, { id });
	}

	async removeValue(table, path) {
		const keys = await this.getKeys(table);
		if (isObject(path) && typeof newValue === 'undefined') {
			await Promise.all(keys.map(node => this.remove(table, node, path)));
		} else if (typeof path === 'string' && typeof newValue !== 'undefined') {
			await Promise.all(keys.map(node => this.remove(table, node, makeObject(path, null))));
		} else {
			throw new TypeError(`Expected an object as first parameter or a string and a non-undefined value. Got: ${typeof key} and ${typeof value}`);
		}
	}

	async remove(table, id, path) {
		const [entry] = this.db.run(`MATCH (n:${table} {id: {id} }) RETURN n`, { id }).then(data => data.records.map(node => node._fields[0].properties));
		Object.keys(path).map(key => delete entry[key]);
		await this.updatebyID(table, id, entry);
	}
<<<<<<< HEAD

};
=======
>>>>>>> SGv2.2.0

};
