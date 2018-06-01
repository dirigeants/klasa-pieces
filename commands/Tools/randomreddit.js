const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 2,
			description: 'Returns a random reddit post on a given subreddit.',
			usage: '<subreddit:str>',
			usageDelim: ' '
		});
	}

	async run(msg, [subredditName]) {
		const random = await snekfetch
			.get(`https://www.reddit.com/r/${subredditName}/random.json`)
			.then(res => res.body);

		if (random.error) throw `That subreddit doesn't exist, or is banned/private.`;

		if (random[0].data.children[0].data.over_18 && !msg.channel.nsfw) {
			throw 'I cant post a NSFW image in this channel unless you mark it as NSFW!';
		}

		return msg.sendsendMessage(random[0].data.children[0].data.url);
	}

};
