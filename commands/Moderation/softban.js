const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 6,
			botPerms: ['BAN_MEMBERS'],
			runIn: ['text'],

			description: 'Softbans a mentioned user. Currently does not require reason (no mod-log).',
			usage: '<member:user> [days:int{1,7}] [reason:string]',
			usageDelim: ' '
		});

		this.pieces = {
			type: 'commands',
			requiredModules: []
		};
	}

	async run(msg, [user, days = 1, ...reason]) {
		if (user.id === msg.author.id) throw 'Why would you ban yourself?';
		if (user.id === this.client.user.id) throw 'Have I done something wrong?';

		const member = await msg.guild.fetchMember(user).catch(() => null);
		if (member) {
			if (member.highestRole.position >= msg.member.highestRole.position) throw 'You cannot ban this user.';
			if (member.bannable === false) throw 'I cannot ban this user.';
		}

		const options = { days };
		reason = reason.length > 0 ? reason.join(' ') : null;
		if (reason) options.reason = reason;

		await msg.guild.ban(user.id, options);
		await msg.guild.unban(user.id, 'Softban released.');
		return msg.send(`${member.user.tag} got softbanned.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
