const { Inhibitor } = require('klasa');

module.exports = class extends Inhibitor {

	constructor(...args) {
		super(...args, { spamProtection: true });
	}

	async run(msg) {
		if (msg.channel.type === 'text' && msg.guild.settings.deleteCommand === true) return msg.delete();
		return null;
	}

	init() {
		if (!this.client.settings.guilds.schema.hasKey('deleteCommand')) {
			return this.client.settings.guilds.addKey('deleteCommand', { type: 'Boolean', default: false });
		}
		return null;
	}

};
