const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['catfact', 'kittenfact'],
			description: 'Let me tell you a misterious cat fact.'
		});
	}

	async run(msg) {
		const { body } = await snekfetch.get('https://catfact.ninja/fact');
		return msg.send(`📢 **Catfact:** *${body.fact}*`);
	}

};
