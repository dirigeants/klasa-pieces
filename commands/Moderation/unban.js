const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 6,
			requiredPermissions: ['BAN_MEMBERS'],
			runIn: ['text'],
			description: 'Unbans a user.',
			usage: '<user:user> [reason:string] [...]',
			usageDelim: ' '
		});
	}

	async run(msg, [userid, ...reason]) {
		const user = await this.client.users.fetch(userid);
		const bans = await msg.guild.fetchBans();
		if (bans.has(userid)) {
			await msg.guild.members.unban(userid, reason.join(' '));
		}

		return msg.sendMessage(`${user.tag} was unbanned.${reason ? ` With reason of: ${reason}` : ''}`);
	}

};
