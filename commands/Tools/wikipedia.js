const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['wiki'],
			description: 'Finds a Wikipedia Article by title.',
			usage: '<query:str>'
		});
	}

	async run(msg, [query]) {
		const article = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`)
			.then(async res => await res.json())
			.catch(() => {
				throw "I couldn't find a wikipedia article with that title!";
			});

		const embed = new MessageEmbed()
			.setColor(4886754)
			.setThumbnail((article.thumbnail && article.thumbnail.source) || 'https://i.imgur.com/fnhlGh5.png')
			.setURL(article.content_urls.desktop.page)
			.setTitle(article.title)
			.setDescription(article.extract);

		return msg.sendEmbed(embed);
	}

};
