const { Command } = require('klasa');

module.exports = class Engwish extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['hello'],
			description: 'Converts text into some classhic OWOuwu\'s',
			usage: '<Text:str>'
		});
	}

	translate(phrase) {
		const words = phrase.split(' ');
		const finalPhrase = [];
		words.forEach(word => {
			if (Math.random() > 0.7) {
				finalPhrase.push(`${word.charAt(0)}-${word}`);
			} else {
				finalPhrase.push(word);
			}
			if (Math.random() > 0.99) {
				finalPhrase.push("_OwO, what's this?_");
			}
		});
		const x3 = [' x3', ' :3', ' owo', ' OwO', ' OWO', ' X3'];
		return finalPhrase.join(' ').replace('l', 'w').replace('L', 'W').replace('r', 'w').replace('R', 'W') + x3[Math.floor(Math.random() * x3.length)];
	}

	async run(msg, [text]) {
		return msg.send(`**${msg.author.username}:** ${this.translate(text)}`);
	}

};
