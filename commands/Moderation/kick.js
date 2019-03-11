// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			requiredPermissions: ['KICK_MEMBERS'],
			runIn: ['text'],
			description: 'Kicks a mentioned user. Currently does not require reason (no mod-log).',
			usage: '<member:member> [reason:...string]',
			usageDelim: ' '
		});
	}

	async run(msg, [member, reason]) {
		if (member.id === msg.author.id) throw 'Why would you kick yourself?';
		if (member.id === this.client.user.id) throw 'Have I done something wrong?';

		if (member.roles.highest.position >= msg.member.roles.highest.position) throw 'You cannot kick this user.';
		if (!member.kickable) throw 'I cannot kick this user.';

		await member.kick(reason);
		return msg.sendMessage(`${member.user.tag} got kicked.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
