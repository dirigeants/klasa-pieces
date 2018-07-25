/*

	This is to be used with the mute command located in
	/commands/Moderation/mute.js

*/
const { Task } = require('klasa');

module.exports = class extends Task {

	async run({ guild, user }) {
		guild = this.client.guilds.get(guild);
		await guild.members.get(user).roles.remove(guild.configs.roles.muted);
		return;
	}

};
