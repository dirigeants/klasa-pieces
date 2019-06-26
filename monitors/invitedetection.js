// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Monitor } = require('klasa');

// Add to your schema definition:
// KlasaClient.defaultGuildSchema.add('antiinvite', 'boolean', { default: false });

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, {
			name: 'invitedetection',
			enabled: true,
			ignoreSelf: true,
			ignoreOthers: false
		});
	}

	async run(msg) {
		if (!msg.guild || !msg.guild.settings.antiinvite) return null;
		if (await msg.hasAtLeastPermissionLevel(6)) return null;
		if (!/(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(msg.content)) return null;
		return msg.delete()
			.catch(err => this.client.emit('log', err, 'error'));
	}

};
