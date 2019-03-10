// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, { description: 'Rolls a D20' });
	}

	async run(msg) {
		return msg.reply(`Rolling a D20... 🎲 **${Math.ceil(Math.random() * 20)}**`);
	}

};
