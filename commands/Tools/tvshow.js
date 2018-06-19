const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const querystring = require('querystring');
// Create a TMDB account on https://www.themoviedb.org/ (if you haven't yet) and go to https://www.themoviedb.org/settings/api to get your API key.
const tmdbAPIkey = 'API_KEY_HERE';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['tvshows', 'tv', 'tvseries'],
			description: 'Finds a TV show on TMDB.org',
			extendedHelp: 'e.g. `s.tvshow universe, 2`',
			usage: '<Query:str> [Page:number]',
			usageDelim: ','
		});
	}

	async run(msg, [query, page = 1]) {
		// eslint-disable-next-line camelcase
		const qs = querystring.stringify({ api_key: tmdbAPIkey, query });
		const body = await fetch(`https://api.themoviedb.org/3/search/tv?${qs}`)
			.then(response => response.json());
		const show = body.results[page - 1];
		if (!show) throw `I couldn't find a TV show with title **${query}** in page ${page}.`;

		const embed = new MessageEmbed()
			.setColor('RANDOM')
			.setImage(`https://image.tmdb.org/t/p/original${show.poster_path}`)
			.setTitle(`${show.name} (${page} out of ${body.results.length} results)`)
			.setDescription(show.overview)
			.setFooter(`${this.client.user.username} uses the TMDb API but is not endorsed or certified by TMDb.`,
				'https://www.themoviedb.org/static_cache/v4/logos/208x226-stacked-green-9484383bd9853615c113f020def5cbe27f6d08a84ff834f41371f223ebad4a3c.png');
		if (show.title !== show.original_name) embed.addField('Original Title', show.original_name, true);
		embed
			.addField('Vote Count', show.vote_count, true)
			.addField('Vote Average', show.vote_average, true)
			.addField('Popularity', show.popularity, true)
			.addField('First Air Date', show.first_air_date);

		return msg.sendEmbed(embed);
	}

};
