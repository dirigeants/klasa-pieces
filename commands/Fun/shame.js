// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Rings a bell on the server shaming the mentioned person.',
			usage: '<user:user>'
		});
	}

	run(msg, [user]) {
		return msg.sendMessage(`🔔 SHAME 🔔 ${user} 🔔 SHAME 🔔`);
	}

};
