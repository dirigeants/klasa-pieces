const { Monitor } = require('klasa');
const { Permissions: { FLAGS } } = require('discord.js');

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, { ignoreOthers: false });
	}

	async run(msg) {
		if (!msg.member ||
			!msg.guild.configs.everyoneRole ||
			!msg.mentions.roles.size ||
			msg.guild.me.roles.highest.position <= msg.member.roles.highest.position ||
			!msg.guild.me.permissions.has(FLAGS.MANAGE_ROLES) ||
			!await msg.hasAtLeastPermissionLevel(1)
		) return;

		const everyone = msg.guild.roles.get(msg.guild.configs.everyoneRole);
		if (!everyone) {
			await msg.guild.configs.reset('everyoneRole');
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

	async init() {
		if (!this.client.gateways.guilds.schema.has('everyoneRole')) {
			await this.client.gateways.guilds.schema.add('everyoneRole', { type: 'role' });
		}
	}

};
