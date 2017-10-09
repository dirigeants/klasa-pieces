const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['coin'],

			description: 'Flips one or more coins',
			usage: '[coins:int]',
		});
	}

	async run(msg, [coins = 0])  {
		var heads = 0;
		var tails = 0;

		switch (coins > 1) {
			case true:
				for (var i = 0; i < coins; i++) {
					Math.random() > 0.5 ? heads++ : tails++;
				}
				msg.channel.send(`You flipped ${coins} coins. ${heads} ${heads == 1 ? "was" : "were"} heads, and ${tails} ${tails == 1 ? "was" : "were"} tails.`);
				break;
			default:
				msg.channel.send(`You flipped ${Math.random() > 0.5 ? "Heads" : "Tails"}.`);
		}
	}
};
