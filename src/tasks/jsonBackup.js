// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Task, Timestamp } = require('klasa');
const { targz } = require('fs-nextra');
const { resolve } = require('path');

module.exports = class extends Task {

	constructor(...args) {
		super(...args);
		this.timestamp = new Timestamp('yyyy-mm-dd');
	}

	get provider() {
		return this.client.providers.get('json');
	}

	async run(data = { folder: './' }) {
		if (!data || !data.folder) data = { folder: './' };

		await targz(resolve(data.folder, `json-backup-${this.timestamp}.tar.gz`), this.provider.baseDirectory);
	}

};
