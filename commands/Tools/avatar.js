const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Shows a user\'s avatar',
			usage: '[user:user]'
		});
	}

	async run(msg, [user = msg.author]) {
		const avatar = user.displayAvatarURL({ size: 512 });

		return msg.sendEmbed(new MessageEmbed()
			.setAuthor(user.username, avatar)
			.setImage(avatar));
	}

};
