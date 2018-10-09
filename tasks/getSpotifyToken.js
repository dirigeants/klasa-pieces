const { Task } = require('klasa');
const fetch = require('node-fetch');

// Login to https://developer.spotify.com/dashboard/applications
// Create an app & get your clientID/secret, place them below
// Run every 1 hour to refresh: this.client.schedule.create("getSpotifyToken", "*/60 * * * *")
const clientID = '';
const clientSecret = '';

const authorization = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');

module.exports = class extends Task {

	async run() {
		this._getToken();
	}

	async init() {
		this._getToken();
	}

	async _getToken() {
		const accessToken = await fetch(`https://accounts.spotify.com/api/token`, {
			method: 'POST',
			body: 'grant_type=client_credentials',
			headers: {
				Authorization: `Basic ${authorization}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		})
			.then(response => response.json())
			.then(response => response.access_token)
			.catch(console.error);

		this.client._spotifyToken = accessToken;
	}

};
