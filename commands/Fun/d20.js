const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, { description: 'Rolls a D20' });
	}

	async run(msg) {
		return msg.reply(`Rolling a D20... 🎲 **${Math.ceil(Math.random() * 20)}**`);
	}

};
