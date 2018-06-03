const { Command } = require('klasa');
const MarkovChain = require('markovchain');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Generate a markov chain from the text chat.',
			requiredPermissions: ['READ_MESSAGE_HISTORY']
		});
	}

	async run(msg) {
		let messageBank = await msg.channel.messages.fetch({ limit: 100 });

		for (let i = 0; i < 20; i++) {
			const fetchedMessages = await msg.channel.messages.fetch({ limit: 100, before: messageBank.last().id });
			messageBank = messageBank.concat(fetchedMessages);
		}

		const markovBank = [];
		for (const message of messageBank.values()) {
			if (!message.content) continue;
			markovBank.push(message.content);
		}

		const quotes = new MarkovChain(markovBank.join(' '));
		const chain = quotes.start(this.useUpperCase).end(20).process();
		return msg.sendMessage(chain.substring(0, 1999));
	}

	useUpperCase(wordList) {
		const tmpList = Object.keys(wordList).filter((word) => word[0] >= 'A' && word[0] <= 'Z');
		return tmpList[~~(Math.random() * tmpList.length)];
	}

};
