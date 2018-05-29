const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 2,
			description: 'A Random dog picture.'
		});
	}

	async run(msg) {
		const dog = await snekfetch
			.get(`https://dog.ceo/api/breeds/image/random`)
			.then(res => res.body.message)
			.catch(() => msg.send('There was an error. Please try again.'));
		return msg.send(dog);
	}

};
