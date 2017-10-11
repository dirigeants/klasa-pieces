const { Command } = require('klasa');
const snek = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomdog', 'woof'],
			description: 'Grabs a random dog image from random.dog.',
			extendedHelp: 'This command grabs a random dog from "https://random.dog/woof.json".'
		});
	}

	async run(msg) {
		const { body } = await snek.get('https://random.dog/woof.json');
		return msg.send('I found this dog image. Here you go!', { files: [{ attachment: body.url, name: `dog.${body.url.split('.')[2]}` }] });
	}

};
