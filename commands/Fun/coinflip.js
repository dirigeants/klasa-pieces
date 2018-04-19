const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['coin'],

			description: 'Flips one or more coins',
			usage: '[coins:int]'
		});
	}

	run(msg, [coins = 0]) {
		if (coins > 1) {
			let heads = 0;
			let tails = 0;
			for (let i = 0; i < coins; i++) {
				if (Math.random() > 0.5) heads++;
				else tails++;
			}
			return msg.sendMessage(`You flipped ${coins} coins. ${heads} ${heads === '1' ? 'was' : 'were'} heads, and ${tails} ${tails === '1' ? 'was' : 'were'} tails.`);
		}
		return msg.sendMessage(`You flipped ${Math.random() > 0.5 ? 'Heads' : 'Tails'}.`);
	}

};
