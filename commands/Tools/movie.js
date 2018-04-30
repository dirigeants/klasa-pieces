const { Command } = require('klasa');
const snekfetch = require('snekfetch');
// Create a TMDB account on https://www.themoviedb.org/ (if you haven't yet) and go to https://www.themoviedb.org/settings/api to get your API key.
const tmdbAPIkey = '';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['movies', 'film', 'films'],
			description: 'Finds a movie on TMDB.org',
			extendedHelp: 'e.g. `s.movie infinity war, 2`',
			usage: '<Query:str> [Page:number]',
			usageDelim: ', '
		});
	}

	async run(msg, [query, page = 1]) {
		const request = await snekfetch.get(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbAPIkey}&query=${query}`);
		const movie = request.body.results[page - 1];

		if (!movie) throw `I couldn't find a movie with title **${query}** in page ${page}.`;

		const embed = new this.client.methods.Embed()
			.setImage(`https://image.tmdb.org/t/p/original${movie.poster_path}`)
			.setTitle(`${movie.title} (${page} out of ${request.body.results.length} results)`)
			.setDescription(movie.overview)
			.setFooter(`${this.client.user.username} uses the TMDb API but is not endorsed or certified by TMDb.`, 'https://www.themoviedb.org/static_cache/v4/logos/208x226-stacked-green-9484383bd9853615c113f020def5cbe27f6d08a84ff834f41371f223ebad4a3c.png'); // eslint-disable-line max-len
		if (movie.title !== movie.original_title) embed.addField('Original Title', movie.original_title, true);
		embed
			.addField('Vote Count', movie.vote_count, true)
			.addField('Vote Average', movie.vote_average, true)
			.addField('Popularity', movie.popularity, true)
			.addField('Adult Content', movie.adult ? 'Yep' : 'Nope', true)
			.addField('Release Date', movie.release_date);

		return msg.send(embed);
	}

};
