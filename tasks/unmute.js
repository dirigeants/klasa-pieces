/*

	This is to be used with the mute command located in
	/commands/Moderation/mute.js

*/
const { Task } = require('klasa');

module.exports = class extends Task {

	async run({ guild, user }) {
		const _guild = this.client.guilds.get(guild);
		const member = await _guild.members.fetch(user);
		if (!member) return;
		member.roles.remove(_guild.configs.roles.muted);
	}

};
