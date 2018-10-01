const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomlizard'],
			description: 'Grabs a random lizard image from nekos.life.',
			extendedHelp: 'This command grabs a random lizard from "https://nekos.life/api/v2/img/lizard".'
		});
	}

	async run(msg) {
		const url = await fetch('https://nekos.life/api/v2/img/lizard')
			.then(response => response.json())
			.then(body => body.url);
		return msg.channel.sendFile(url);
	}

};
