const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['yomama'],

			description: 'Yo momma is so fat, yo.'
		});

		this.pieces = {
			type: 'commands',
			requiredModules: ['snekfetch']
		};
	}

	async run(msg) {
		const res = await snekfetch.get('http://api.yomomma.info')
			.then(data => JSON.parse(data.text));

		return msg.send(`📢 **Yomomma joke:** *${res.joke}*`);
	}

};
