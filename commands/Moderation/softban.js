// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			requiredPermissions: ['BAN_MEMBERS'],
			runIn: ['text'],
			description: 'Softbans a mentioned user. Currently does not require reason (no mod-log).',
			usage: '<member:user> [days:int{1,7}] [reason:...string]',
			usageDelim: ' '
		});
	}

	async run(msg, [user, days = 1, reason]) {
		if (user.id === msg.author.id) throw 'Why would you ban yourself?';
		if (user.id === this.client.user.id) throw 'Have I done something wrong?';

		const member = await msg.guild.members.fetch(user).catch(() => null);
		if (member) {
			if (member.roles.highest.position >= msg.member.roles.highest.position) throw 'You cannot ban this user.';
			if (!member.bannable) throw 'I cannot ban this user.';
		}

		const options = { days };
		if (reason) options.reason = reason;

		await msg.guild.members.ban(user, options);
		await msg.guild.members.unban(user, 'Softban released.');
		return msg.sendMessage(`${member.user.tag} got softbanned.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
