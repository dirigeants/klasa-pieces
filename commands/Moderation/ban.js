const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 6,
			botPerms: ['BAN_MEMBERS'],
			runIn: ['text'],

			description: 'Bans a mentioned user. Currently does not require reason (no mod-log).',
			usage: '<member:user> [reason:string]',
			usageDelim: ' '
		});
	}

	async run(msg, [user, ...reason]) {
		if (user.id === msg.author.id) throw 'Why would you ban yourself?';
		if (user.id === this.client.user.id) throw 'Have I done something wrong?';

		const member = await msg.guild.members.fetch(user).catch(() => null);
		if (member) {
			if (member.highestRole.position >= msg.member.highestRole.position) throw 'You cannot ban this user.';
			if (member.bannable === false) throw 'I cannot ban this user.';
		}

		const options = {};
		reason = reason.length > 0 ? reason.join(' ') : null;
		if (reason) options.reason = reason;

		await msg.guild.ban(user.id, options);
		return msg.sendMessage(`${member.user.tag} got banned.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
