const { Command } = require('klasa');
const { MessageAttachment } = require('discord.js');
const cloud = require('d3-cloud');
const { Canvas } = require('canvas');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Generate a wordcloud from the messages in a chat.',
			cooldown: 3,
			requiredPermissions: ['ATTACH_FILES']
		});
	}

	async run(msg) {
		const FinalImage = new Canvas(2000, 2000);
		const ctx = FinalImage.getContext('2d');
		let messageBank = await msg.channel.messages.fetch({ limit: 100 });
		const wordBank = {};
		for (let i = 0; i < 20; i++) {
			const fetchedMessages = await msg.channel.messages.fetch({ limit: 100, before: messageBank.last().id });
			messageBank = messageBank.concat(fetchedMessages);
		}

		for (const message of messageBank.values()) {
			if (!message.content) continue;
			if (message.content.length <= 2) continue;
			message.content.split('.').join(' ').split(' ').forEach(word => {
				const cleanWord = word.replace(/\W+/g, '').substring(0, 20);
				if (!wordBank[cleanWord]) wordBank[cleanWord] = 0;
				wordBank[cleanWord]++;
			});
		}

		const wordList = [];

		for (const word in wordBank) {
			if (wordBank[word] < 3) continue;
			if (word.length < 5) continue;
			wordList.push({ text: word, size: 10 * wordBank[word] });
		}
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, 2000, 2000);
		ctx.translate(1000, 1000);
		const end = (words) => {
			for (let i = 0; i < words.length; i++) {
				const word = words[i];
				const rotation = word.rotate;
				ctx.fillStyle = `#${(Math.random() * 0xFFFFFF << 0).toString(16)}`;
				ctx.font = `${(word.size * 0.8) + 3}px Arial`;
				ctx.rotate(rotation);
				ctx.fillText(word.text, word.x, word.y);
				ctx.rotate(-rotation);
			}
			const buffer = FinalImage.toBuffer();
			return msg.sendMessage(new MessageAttachment(buffer, this.randFileName()));
		};


		cloud().size([1950, 1950])
			.canvas(() => new Canvas(1, 1))
			.words(wordList)
			.padding(1)
			.rotate(() => 0)
			.font('Arial')
			.text((word) => word.text)
			.fontSize((word) => word.size)
			.on('end', end)
			.start();
	}

};
