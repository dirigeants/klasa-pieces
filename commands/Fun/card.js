// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♠️', '♦', '♥️', '♠️'];

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Draws some random cards from a deck.',
			usage: '<num:int{1,10}>'
		});
	}

	run(msg, [numCards]) {
		const lines = [];

		for (let i = 0; i < numCards; ++i) {
			lines.push(`**${ranks[Math.floor(Math.random() * ranks.length)]}**${suits[Math.floor(Math.random() * suits.length)]}`);
		}

		return msg.sendMessage(lines.join(', '));
	}

};
