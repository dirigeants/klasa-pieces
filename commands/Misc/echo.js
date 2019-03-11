// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			runIn: ['text'],
			description: 'Send a message to a channel through the bot.',
			usage: '[channel:channel] <message:...string>',
			usageDelim: ' '
		});
	}

	async run(msg, [channel = msg.channel, message]) {
		if (channel.guild !== msg.guild) throw 'You can\'t echo in other servers!';
		if (!channel.postable) throw 'The selected channel is not postable.';
		return channel.send(message);
	}

};
