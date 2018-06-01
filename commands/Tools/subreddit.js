const { Command } = require('klasa');
const snekfetch = require('snekfetch');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['sub'],
			description: 'Returns information on a subreddit.',
			usage: '<subredditName:str>'
		});
	}

	async run(msg, [subredditName]) {
		let subreddit = await snekfetch
			.get(`https://www.reddit.com/r/${subredditName}/about.json`)
			.then(res => res.body);

		if (subreddit.kind !== 't5') throw `That subreddit doesn't exist.`;
		else subreddit = subreddit.data;

		return msg.sendEmbed(new MessageEmbed()
			.setTitle(subreddit.title)
			.setDescription(subreddit.public_description)
			.setURL(`https://www.reddit.com/r/${subredditName}/`)
			.setColor(6570404)
			.setThumbnail(subreddit.icon_img)
			.setImage(subreddit.banner_img)
			.addField('Subscribers', subreddit.subscribers.toLocaleString(), true)
			.addField('Users Active', subreddit.accounts_active.toLocaleString(), true));
	}

};
