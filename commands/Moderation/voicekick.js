const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			enabled: true,
			runIn: ['text'],
			requiredPermissions: ['MOVE_MEMBERS'],
			permissionLevel: 6,
			description: 'Disconnects a member from a voice channel.',
			usage: '<member:member> [reason:...string]',
			usageDelim: ' '
		});
	}

	async run(message, [member, reason]) {
		if (member.id === message.author.id) throw 'Why would you voice kick yourself?';
		if (member.id === this.client.user.id) throw 'Have I done something wrong?';
		if (!member.voice.channelID) throw 'That member is not in a voice channel.';
		if (member.roles.highest.position >= message.member.roles.highest.position) throw 'You cannot voice kick this user.';

		await member.voice.setChannel(null, reason);
		return message.send(`Voice kicked **${member.user.tag}**.${reason ? `With reason of: ${reason}` : ''}`);
	}

};
