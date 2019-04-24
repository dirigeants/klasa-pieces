const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Shows a users\' avatar',
			usage: '[user:user]'
		});
	}

	async run(msg, [user]) {
		if (!user) user = msg.author;
		const avatar = user.displayAvatarURL({ size: 512 });

		const embed = new MessageEmbed()
			.setAuthor(user.username, avatar)
			.setImage(avatar);

		return msg.sendEmbed(embed);
	}


};
