const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			runIn: ['text'],

			description: 'Send a message to a channel through the bot.',
			usage: '[channel:channel] <message:string> [...]',
			usageDelim: ' '
		});
	}

	async run(msg, [channel = msg.channel, ...message]) {
		if (channel.postable === false && channel !== msg.channel) throw 'The selected channel is not postable.';
		if (channel.guild !== msg.guild) throw 'You can\'t echo in other servers!';
		return channel.send(message.join(' '));
	}

};
