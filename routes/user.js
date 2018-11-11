// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Route } = require('klasa-dashboard-hooks');

module.exports = class extends Route {

	constructor(...args) {
		super(...args, { route: 'users/:userID' });
	}

	get(request, response) {
		const { userID } = request.params;
		const user = this.client.users.get(userID);
		if (!user) return response.end('{}');
		return response.end(JSON.stringify(user));
	}

};
