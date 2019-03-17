// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Task, Timestamp } = require('klasa');
const { targz, ensureDir } = require('fs-nextra');
const { resolve, dirname } = require('path');

module.exports = class extends Task {

	constructor(...args) {
		super(...args);
		this.timestamp = new Timestamp('YYYY-MM-DD[T]HHmmss');
	}

	get provider() {
		return this.client.providers.get('json');
	}

	async run(data = { folder: './' }) {
		if (!('folder' in data)) data = { folder: './' };
		const file = resolve(data.folder, `json-backup-${this.timestamp}.tar.gz`);

		await ensureDir(dirname(file));
		await targz(file, this.provider.baseDirectory);
	}

};
