const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Rings a bell on the server shaming the mentioned person.',
			usage: '<user:mention>'
		});

		this.pieces = {
			type: 'commands',
			requiredModules: []
		};
	}

	async run(msg, [user]) {
		return msg.send(`🔔 SHAME 🔔 ${user} 🔔 SHAME 🔔`);
	}

};
