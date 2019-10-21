const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomfox'],
			description: 'Grabs a random fox image from randomfox.ca',
			extendedHelp: 'This command grabs a random fox from "https://randomfox.ca/floof/".'
		});
	}

	async run(msg) {
		const url = await fetch('https://randomfox.ca/floof/')
			.then(response => response.json())
			.then(body => body.image);
		return msg.channel.sendFile(url);
	}

};
