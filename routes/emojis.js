// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Route } = require('klasa-dashboard-hooks');

module.exports = class extends Route {

	constructor(...args) {
		super(...args, { route: 'guilds/:guildID/emojis/:emojiID' });
	}

	get(request, response) {
		const { guildID, emojiID } = request.params;
		const guild = this.client.guilds.get(guildID);
		if (!guild) return response.end(404);
		const emoji = guild.emojis.get(emojiID);
		if (!emoji) return response.end(404);
		return response.end(JSON.stringify(emoji));
	}

};
