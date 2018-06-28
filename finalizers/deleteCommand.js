const { Finalizer } = require('klasa');

module.exports = class extends Finalizer {

	async run(msg) {
		if (!msg.deletable && !msg.guild && !msg.guild.configs.deleteCommand) return null;
		return msg.delete();
	}

	async init() {
		if (!this.client.gateways.guilds.schema.has('deleteCommand')) {
			await this.client.gateways.guilds.schema.add('deleteCommand', { type: 'boolean', default: false });
		}
	}

};
