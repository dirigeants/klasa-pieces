const { Monitor } = require('klasa');
const { Permissions: { FLAGS } } = require('discord.js');

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, { ignoreOthers: false });
	}

	async run(msg) {
		if (!msg.member ||
			!msg.guild.configs.roles.everyone ||
			!msg.mentions.roles.size ||
			msg.guild.me.roles.highest.position <= msg.member.roles.highest.position ||
			!msg.guild.me.permissions.has(FLAGS.MANAGE_ROLES)
		) return;

		const everyone = msg.guild.roles.get(msg.guild.configs.roles.everyone);
		if (!everyone) {
			await msg.guild.configs.reset('roles.everyone');
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

	// Run schema initialising
	async init() {
		// Ensure guild configs have the keys needed for this piece
		const { schema } = this.client.gateways.guilds;

		if (!schema.has('roles')) {
			await schema.add('roles', { everyone: { type: 'role' } });
		} else if (!schema.roles.has('everyone')) {
			await schema.roles.add('everyone', { type: 'role' });
		}
	}

};
