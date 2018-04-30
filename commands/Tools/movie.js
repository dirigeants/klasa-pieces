const { Command } = require('klasa');
const snekfetch = require('snekfetch');
// Create a TMDB account on https://www.themoviedb.org/ (if you haven't yet) and go to https://www.themoviedb.org/settings/api to get your API key.
const tmdbAPIkey = "";

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
        const tmdb = request.body.results[page - 1];
        
        if (!tmdb) throw `I couldn't find a movie with title **${query}** in page ${page}.`;
        
        const embed = new this.client.methods.Embed()
            .setImage(`https://image.tmdb.org/t/p/original${tmdb.poster_path}`)
            .setTitle(`${tmdb.title} (${page} out of ${request.body.results.length} results)`)
            .setDescription(tmdb.overview)
            .setFooter(`${this.client.user.username} uses the TMDb API but is not endorsed or certified by TMDb.`, 'https://www.themoviedb.org/static_cache/v4/logos/208x226-stacked-green-9484383bd9853615c113f020def5cbe27f6d08a84ff834f41371f223ebad4a3c.png');
        if (tmdb.title !== tmdb.original_title) embed.addField('Original Title', tmdb.original_title, true);
        embed
            .addField('Vote Count', tmdb.vote_count, true)
            .addField('Vote Average', tmdb.vote_average, true)
            .addField('Popularity', tmdb.popularity, true)
            .addField('Adult Content', tmdb.adult ? 'Yep' : 'Nope', true)
            .addField('Release Date', tmdb.release_date);
            
        return msg.send(embed);
    }

};
