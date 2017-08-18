const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 6,
			runIn: ['text'],

			description: 'Send a message to a channel throught the bot.',
			usage: '[channel:channel] <message:string> [...]',
			usageDelim: ' '
		});

		this.pieces = {
			type: 'commands',
			requiredModules: []
		};
	}

	async run(msg, [channel = msg.channel, ...message]) {
		if (channel.postable === false) throw 'The selected channel is not postable.';
		return channel.send(message.join(' '));
	}

};
