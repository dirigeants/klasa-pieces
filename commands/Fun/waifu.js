const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, { description: 'Sends a randomly generated Waifu from thiswaifudoesnotexist.net' });
	}

	async run(msg) {
		return msg.sendMessage(`https://www.thiswaifudoesnotexist.net/example-${Math.floor(Math.random() * 100000)}.jpg`);
	}

};
