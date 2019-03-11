// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Provider } = require('klasa');
const firebase = require('firebase-admin');

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

module.exports = class extends Provider {

	constructor(...args) {
		super(...args);
		this.db = null;
	}
	async init() {
		await firebase.initializeApp({
			credential: firebase.credential.cert(this.client.options.providers.firestore.credentials),
			databaseURL: this.client.options.providers.firestore.databaseURL
		});

		this.db = firebase.firestore();
	}

	hasTable(table) {
		return this.db.collection(table).get().then(col => Boolean(col.size));
	}

	createTable(table) {
		return this.db.collection(table);
	}

	getKeys(table) {
		return this.db.collection(table).get().then(snaps => snaps.docs.map(snap => snap.id));
	}

	get(table, id) {
		return this.db.collection(table).doc(id).get().then(snap => this.packData(snap.data(), snap.id));
	}

	has(table, id) {
		return this.db.collection(table).doc(id).get().then(data => data.exists);
	}

	create(table, id, doc = {}) {
		return this.db.collection(table).doc(id).set(this.parseUpdateInput(doc));
	}

	update(table, id, doc) {
		return this.db.collection(table).doc(id).update(this.parseUpdateInput(doc));
	}

	delete(table, id) {
		return this.db.collection(table).doc(id).delete();
	}

	replace(...args) {
		return this.create(...args);
	}

	async getAll(table, filter = []) {
		const data = await this.db.collection(table).get()
			.then(snaps => snaps.docs.map(snap => this.packData(snap.data(), snap.id)));

		return filter.length ? data.filter(nodes => filter.includes(nodes.id)) : data;
	}

	packData(data, id) {
		return {
			...data,
			id
		};
	}

};
