// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomdog', 'woof'],
			description: 'Grabs a random dog image from random.dog.',
			extendedHelp: 'This command grabs a random dog from "https://random.dog/woof.json".'
		});
	}

	async run(msg) {
		const url = await fetch('https://dog.ceo/api/breeds/image/random')
			.then(response => response.json())
			.then(body => body.message);
		return msg.channel.sendFile(url);
	}

};
