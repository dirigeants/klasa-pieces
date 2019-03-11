// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const MarkovChain = require('markovchain');
const messageLimitHundreds = 1;

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Generate a markov chain from the text chat.',
			requiredPermissions: ['READ_MESSAGE_HISTORY']
		});
	}

	async run(msg) {
		let messageBank = await msg.channel.messages.fetch({ limit: 100 });
		for (let i = 1; i < messageLimitHundreds; i++) {
			messageBank = messageBank.concat(await msg.channel.messages.fetch({ limit: 100, before: messageBank.last().id }));
		}

		const quotes = new MarkovChain(messageBank.map(message => message.content).join(' '));
		const chain = quotes.start(this.useUpperCase).end(20).process();
		return msg.sendMessage(chain.substring(0, 1999));
	}

	useUpperCase(wordList) {
		const tmpList = Object.keys(wordList).filter((word) => word[0] >= 'A' && word[0] <= 'Z');
		return tmpList[Math.floor(Math.random() * tmpList.length)];
	}

};
