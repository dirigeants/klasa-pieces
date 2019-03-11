// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Monitor } = require('klasa');
const { Permissions: { FLAGS } } = require('discord.js');

// Add to your schema definition:
// KlasaClient.defaultGuildSchema.add('roles', schema => schema
//   .add('everyone', 'role'));

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, { ignoreOthers: false });
	}

	async run(msg) {
		if (!msg.member ||
			!msg.guild.settings.roles.everyone ||
			!msg.mentions.roles.size ||
			msg.guild.me.roles.highest.position <= msg.member.roles.highest.position ||
			!msg.guild.me.permissions.has(FLAGS.MANAGE_ROLES)
		) return;

		const everyone = msg.guild.roles.get(msg.guild.settings.roles.everyone);
		if (!everyone) {
			await msg.guild.settings.reset('roles.everyone');
			return;
		}
		if (!msg.mentions.roles.has(everyone.id)) return;

		await msg.member.roles.add(everyone);
		await msg.reply([
			'Welcome to the everyone role.',
			'Whenever someone mentions it, they get the role and everyone who has it is mentioned.',
			'',
			'By the way leaving and rejoining to remove the role from yourself **WILL** result in a stricter punishment.'
		].join('\n'));
	}

};
