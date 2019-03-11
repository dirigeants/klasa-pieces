// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Route } = require('klasa-dashboard-hooks');

module.exports = class extends Route {

	constructor(...args) {
		super(...args, { route: 'guilds' });
	}

	get(request, response) {
		return response.end(JSON.stringify(this.client.guilds.keyArray()));
	}

};
