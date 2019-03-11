// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
/*
*    Requires getSpotifyToken task
*    https://github.com/dirigeants/klasa-pieces/blob/master/tasks/getSpotifyToken.js
*
*/
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
		if (!this.client._spotifyToken) return this.client.emit('wtf', 'Spotify Token is undefined.');

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

		if (artist) return msg.sendMessage(artist.external_urls.spotify);
		throw "Couldn't find any artists with that name.";
	}

};
