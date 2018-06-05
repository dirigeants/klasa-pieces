const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			requiredPermissions: ['KICK_MEMBERS'],
			runIn: ['text'],

			description: 'Kicks a mentioned user. Currently does not require reason (no mod-log).',
			usage: '<member:member> [reason:string] [...]',
			usageDelim: ' '
		});
	}

	async run(msg, [member, ...reason]) {
		if (member.id === msg.author.id) throw 'Why would you kick yourself?';
		if (member.id === this.client.user.id) throw 'Have I done something wrong?';
		if (member.highestRole.position >= msg.member.highestRole.position) throw 'You cannot kick this user.';
		if (member.kickable === false) throw 'I cannot kick this user.';

		reason = reason.length > 0 ? reason.join(' ') : null;
		await member.kick(reason);
		return msg.sendMessage(`${member.user.tag} got kicked.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
