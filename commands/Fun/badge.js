const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Get a themed badge from robohash.org',
			usage: '[user:mention] [set:integer{1,4}]',
			usageDelim: ' '
		});
	}

	async run(message, [user = message.author, set = 1]) {
		return message.sendEmbed(new MessageEmbed()
			.setImage(`https://robohash.org/${user.id}?set=set${set}`)
			.setColor('RANDOM')
			.setFooter(`Requested by ${message.author.tag}`, message.author.displayAvatarURL())
			.setTimestamp());
	}

};
