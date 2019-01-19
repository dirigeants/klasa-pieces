const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomduck', 'ducc'],
			description: 'Grabs a random duck image from random-d.uk.',
			extendedHelp: 'This command grabs a random duck from "https://random-d.uk/api/v1/random".'
		});
	}

	async run(msg) {
		const url = await fetch('https://random-d.uk/api/v1/random')
			.then(response => response.json())
			.then(body => body.url);
		return msg.channel.sendFile(url);
	}

};
