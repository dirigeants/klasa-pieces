const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['coin'],

			description: 'Flips a (pseudo) fair coin.'
		});

		this.pieces = {
			type: 'commands',
			requiredModules: []
		};
	}

	async run(msg) {
		return msg.reply(`You flipped ${Math.random() > 0.5 ? 'Heads' : 'Tails'}.`);
	}

};
