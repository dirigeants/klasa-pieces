// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Task } = require('klasa');

/*

	This is to be used with the remindme command located in
	/commands/Tools/remindme.js

*/

module.exports = class extends Task {

	async run({ channel, user, text }) {
		const _channel = this.client.channels.get(channel);
		if (_channel) await _channel.send(`<@${user}> You wanted me to remind you: ${text}`);
	}

};
