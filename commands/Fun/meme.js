const { MessageEmbed } = require('discord.js');
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, { description: 'Shows a meme image from reddit.' });
		this._subreddits = [
			'memes',
			'DeepFriedMemes',
			'bonehurtingjuice',
			'surrealmemes',
			'dankmemes',
			'meirl',
			'me_irl',
			'funny'
		];
	}

	async run(msg) {
		const data = await fetch(`https://imgur.com/r/${this._subreddits[Math.floor(Math.random() * this._subreddits.length)]}/hot.json`)
			.then(response => response.json())
			.then(body => body.data);
		const selected = data[Math.floor(Math.random() * data.length)];
		return msg.send(new MessageEmbed().setImage(`http://imgur.com/${selected.hash}${selected.ext.replace(/\?.*/, '')}`));
	}

};
