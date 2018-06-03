const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, { description: 'Returns a random Donald Trump quote.' });
	}

	async run(msg) {
		const { value } = await snekfetch
			.get(`https://api.tronalddump.io/random/quote`)
			.then(res => JSON.parse(res.body))
			.catch(() => { throw 'There was an error. Please try again.'; });

		return msg.sendMessage(value);
	}

};
