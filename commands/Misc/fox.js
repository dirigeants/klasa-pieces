const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomfox'],
			description: 'Grabs a random fox image.'
		});
	}

	async run(msg) {
		const { body } = await snekfetch.get('https://randomfox.ca/floof/');
		return msg.channel.sendFile(body.image);
	}

};
