const { Inhibitor } = require('klasa');

module.exports = class extends Inhibitor {

	constructor(...args) {
		super(...args, { spamProtection: true });
	}

	async run(msg) {
		if (msg.channel.type === 'text' && msg.guild.configs.deleteCommand === true) return msg.delete();
		return null;
	}

	async init() {
		if (!this.client.gateways.guilds.schema.hasKey('deleteCommand')) {
			await this.client.gateways.guilds.schema.addKey('deleteCommand', { type: 'boolean', default: false });
		}
	}

};
