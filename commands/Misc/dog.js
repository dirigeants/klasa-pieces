const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomdog', 'woof'],
			description: 'Grabs a random dog image from random.dog.',
			extendedHelp: 'This command grabs a random dog from "https://random.dog/woof.json".'
		});
	}

	async run(msg) {
		const { body: { message } } = await snekfetch.get('https://dog.ceo/api/breeds/image/random');
		return msg.channel.sendFile(message);
	}

};
