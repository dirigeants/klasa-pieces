// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomcat', 'meow'],
			description: 'Grabs a random cat image from random.cat.'
		});
	}

	async run(msg) {
		const file = await fetch('http://aws.random.cat/meow')
			.then(response => response.json())
			.then(body => body.file);
		return msg.channel.sendFile(file, `cat.${file.slice(file.lastIndexOf('.'), file.length)}`);
	}

};
