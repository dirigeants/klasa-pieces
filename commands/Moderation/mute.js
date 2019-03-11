// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command, Duration } = require('klasa');

/*

	To use this correctly, you will also need the unmute task located in
	/tasks/unmute.js

*/

// Add to your schema definition:
// KlasaClient.defaultGuildSchema.add('roles', schema => schema
//   .add('muted', 'role'));

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			requiredPermissions: ['MANAGE_ROLES'],
			runIn: ['text'],
			description: 'Mutes a mentioned member.',
			usage: '[when:time] <member:member> [reason:...string]',
			usageDelim: ' '
		});
	}

	async run(msg, [when, member, reason]) {
		if (member.id === msg.author.id) throw 'Why would you mute yourself?';
		if (member.id === this.client.user.id) throw 'Have I done something wrong?';

		if (member.roles.highest.position >= msg.member.roles.highest.position) throw 'You cannot mute this user.';

		if (member.roles.has(msg.guild.settings.roles.muted)) throw 'The member is already muted.';
		await member.roles.add(msg.guild.settings.roles.muted);

		if (when) {
			await this.client.schedule.create('unmute', when, {
				data: {
					guild: msg.guild.id,
					user: member.id
				}
			});
			return msg.sendMessage(`${member.user.tag} got temporarily muted for ${Duration.toNow(when)}.${reason ? ` With reason of: ${reason}` : ''}`);
		}

		return msg.sendMessage(`${member.user.tag} got muted.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
