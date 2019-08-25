// Copyright (c) 2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Sends an avatar generated from adorable.io',
			usage: '[name:str]'
		});
	}

	async run(msg, [name]) {
		return msg.send(`https://api.adorable.io/avatars/285/${
			encodeURIComponent(name || msg.author.username || msg.id)
		}.png`);
	}

};
