// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['roll'],
			description: 'Roll the dice.'
		});
	}

	run(msg) {
		// eslint-disable-next-line no-mixed-operators
		const roll = Math.floor(Math.random() * 6 + 1);
		return msg.channel.send(`${msg.author.username} rolled: ${roll}`);
	}

};
