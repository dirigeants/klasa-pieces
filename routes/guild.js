// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Route } = require('klasa-dashboard-hooks');

module.exports = class extends Route {

	constructor(...args) {
		super(...args, { route: 'guilds/:guildID' });
	}

	get(request, response) {
		const { guildID } = request.params;
		const guild = this.client.guilds.get(guildID);
		if (!guild) return response.end('{}');
		return response.end(JSON.stringify(guild));
	}

};
