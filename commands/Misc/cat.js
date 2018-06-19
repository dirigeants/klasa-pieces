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
		const res = await fetch('http://aws.random.cat/meow');
		const { file } = await res.json();
		return msg.channel.sendFile(file, `cat.${file.slice(file.lastIndexOf('.'), file.length)}`);
	}

};
