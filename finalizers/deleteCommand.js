// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Finalizer } = require('klasa');

// Add to your schema definition:
// KlasaClient.defaultGuildSchema.add('deleteCommand', 'boolean', { default: false });

module.exports = class extends Finalizer {

	async run(msg) {
		if (msg.guild && msg.guild.settings.deleteCommand && msg.deletable) await msg.delete();
	}

};
