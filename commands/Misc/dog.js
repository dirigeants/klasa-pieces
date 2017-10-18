const { Command } = require('klasa');
const snek = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['randomdog', 'woof'],
			description: 'Grabs a random dog image from random.dog.',
			extendedHelp: 'This command grabs a random dog from "https://dog.ceo/api/breeds/image/random".'
		});
	}

	async run(msg) {
		const { body: data } = await snek.get("https://dog.ceo/api/breeds/image/random");
        await msg.channel.send({ files: [{ attachment: data.message, name: "Doggy.png" }] }).catch(e => msg.channel.send(e));
	}

};
