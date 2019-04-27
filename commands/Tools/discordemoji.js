const { Command } = require('klasa');
const fetch = require('node-fetch');

const API_URL = 'https://discordemoji.com/api/';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['de'],
			description: 'Searches discordemoji.com for an emoji.',
			usage: '<query:str{1,20}> [count:int{1,100}]',
			usageDelim: ','
		});
		this.emojis = null;
	}

	async run(msg, [query, count = 4]) {
		const matches = this.emojis.filter(({ nsfw, title }) => {
			// Don't post NSFW emoji in a SFW channel
			if (!msg.channel.nsfw && nsfw) return false;
			return title.toUpperCase().includes(query.toUpperCase());
		});

		if (matches.length === 0) return msg.send('No results.');

		return msg.send(
			matches
				.sort(() => Math.random() - 0.5)
				.slice(0, count)
				.map(emj => emj.image)
				.join(' '));
	}

	async init() {
		// Fetch the emojis and categories from the API
		const [emojis, cats] = await Promise.all(
			[API_URL, `${API_URL}?request=categories`].map(url => fetch(url).then(res => res.json()))
		);

		// Change the emojis' properties to be more useful
		this.emojis = emojis.map(emj => ({
			...emj,
			category: cats[emj.category],
			nsfw: cats[emj.category] === 'NSFW',
			description: emj.description.includes('View more') ? '' : emj.description
		}));
	}

};
