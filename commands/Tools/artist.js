// Requires getSpotifyToken task
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 10,
			description: 'Searches Spotify for an artist, and returns an embed.',
			usage: '<query:str{1,100}>'
		});
	}

	async run(msg, [query]) {
		if (!this.client._spotifyToken) {
			throw 'Missing access token for Spotify. Please try again in a few minutes.';
		}

		const artist = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`,
			{
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.client._spotifyToken}`
				}
			})
			.then(response => response.json())
			.then(response => response.artists.items[0])
			.catch(() => { throw 'There was an error. Please try again later.'; });

		if (!artist) throw "Couldn't find any artists with that name.";
		return msg.sendMessage(artist.external_urls.spotify);
	}

};
