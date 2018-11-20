// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Make the bot say something',
			name: 'say',
			usage: '<message:string>',
			disableEveryone: true,
			permissionLevel: 4,
			aliases: ['echo'],
			usageDelim: ' '
		});
	}

	async run(msg, [args]) {
		// eslint-disable-next-line no-empty-function
		msg.delete().catch(() => {});
		return msg.channel.send(args);
	}

};
