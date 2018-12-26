// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomcat', 'meow'],
			description: 'Grabs a random cat. Use the "--gif" flag to get a GIF.'
		});
	}

	async run(msg) {
		return msg.channel.sendFile(`https://cataas.com/cat${msg.flags.gif ? '/gif' : ''}`, `cat.${msg.flags.gif ? 'gif' : 'png'}`);
	}

};
