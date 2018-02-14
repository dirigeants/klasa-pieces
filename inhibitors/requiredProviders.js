const { Inhibitor } = require('klasa');

module.exports = class extends Inhibitor {

	async run(msg, cmd) {
		if (!cmd.requiredProviders || !cmd.requiredProviders.length) return false;
		const providers = cmd.requiredProviders.filter(provider => !this.client.providers.has(provider));
		if (!providers.length) throw `The client is missing the **${providers.join(', ')}** provider${providers.length > 1 ? 's' : ''} and cannot run.`;
		return false;
	}

};
