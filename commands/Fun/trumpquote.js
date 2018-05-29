const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 2,
			description: 'Returns a random Donald Trump quote.'
		});
	}

	async run(msg) {
		const { value } = await snekfetch
			.get(`https://api.tronalddump.io/random/quote`)
			.then(res => JSON.parse(res.body))
			.catch(() => msg.send('There was an error. Please try again.'));
		return msg.send(value);
	}

};
