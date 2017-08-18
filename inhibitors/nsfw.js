const { Inhibitor } = require('klasa');

module.exports = class extends Inhibitor {

	constructor(...args) {
		super(...args, { spamProtection: true });
	}

	async run(msg, cmd) {
		if (cmd.nsfw !== true || msg.channel.nsfw) return;
		throw 'This command is only available in NSFW channels.';
	}

};
