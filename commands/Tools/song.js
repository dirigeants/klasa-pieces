// Requires getSpotifyToken task
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 10,
			description: 'Searches Spotify for a song, and returns an embeddable link.',
			usage: '<query:str{1,100}>'
		});
	}

	async run(msg, [query]) {
		if (!this.client._spotifyToken) {
			throw 'Missing access token for Spotify. Please try again in a few minutes.';
		}

		const song = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
			{
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.client._spotifyToken}`
				}
			})
			.then(response => response.json())
			.then(response => response.tracks.items[0])
			.catch(() => { throw "Couldn't find any songs with that name."; });

		return msg.sendMessage(song.external_urls.spotify);
	}

};
