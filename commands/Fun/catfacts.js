const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['catfact', 'kittenfact'],
			description: 'Let me tell you a misterious cat fact.'
		});

		this.pieces = {
			type: 'commands',
			requiredModules: ['snekfetch']
		};
	}

	async run(msg) {
		return snekfetch.get('https://catfact.ninja/fact')
			.then(res => msg.send(`📢 **Catfact:** *${res.body.fact}*`));
	}

};
