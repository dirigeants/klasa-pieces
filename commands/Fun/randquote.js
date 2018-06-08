const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const messageLimitHundreds = 1;

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Returns a random message from someone in the channel.',
			requiredPermissions: ['READ_MESSAGE_HISTORY']
		});
	}

	async run(msg) {
		let messageBank = await msg.channel.messages.fetch({ limit: 100 });
		for (let i = 1; i < messageLimitHundreds; i++) {
			messageBank = messageBank.concat(await msg.channel.messages.fetch({ limit: 100, before: messageBank.last().id }));
		}

		for (let i = 0; i < messageBank.size; i++) {
			const message = messageBank.random();
			if (message.author.bot) continue;
			if (message.content.replace(/[\W0-9]*/g, '').length < 20) continue;

			const embed = new MessageEmbed()
				.setDescription(message.content)
				.setAuthor(message.author.username, message.author.displayAvatarURL());
			return msg.sendEmbed(embed);
		}
		return msg.sendMessage(`Couldn't find a quote.`);
	}

};
