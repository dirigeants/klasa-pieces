// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const messageLimitHundreds = 1;

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Returns a random message from someone in the channel.',
			requiredPermissions: ['READ_MESSAGE_HISTORY', 'EMBED_LINKS']
		});
	}

	async run(msg) {
		let messageBank = await msg.channel.messages.fetch({ limit: 100 });
		for (let i = 1; i < messageLimitHundreds; i++) {
			messageBank = messageBank.concat(await msg.channel.messages.fetch({ limit: 100, before: messageBank.last().id }));
		}

		const message = messageBank
			.filter(ms => !ms.author.bot && ms.content.replace(/[\W0-9]*/g, '').length >= 20)
			.random();

		if (!message) throw 'Could not find a quote';

		return msg.sendEmbed(new MessageEmbed()
			.setDescription(message.content)
			.setAuthor(message.author.username, message.author.displayAvatarURL()));
	}

};
