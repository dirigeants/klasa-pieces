// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Task } = require('klasa');
const fetch = require('node-fetch');

// Login to https://developer.spotify.com/dashboard/applications
// Create an app & get your clientID/secret, place them below
// Run every 1 hour to refresh: this.client.schedule.create("getSpotifyToken", "0 * * * *");
const clientID = '';
const clientSecret = '';

const authorization = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
const options = {
	method: 'POST',
	body: 'grant_type=client_credentials',
	headers: {
		Authorization: `Basic ${authorization}`,
		'Content-Type': 'application/x-www-form-urlencoded'
	}
};

module.exports = class extends Task {

	async run() {
		this._getToken();
	}

	async init() {
		this._getToken();
	}

	async _getToken() {
		try {
			this.client._spotifyToken = await fetch(`https://accounts.spotify.com/api/token`, options)
				.then(response => response.json())
				.then(response => response.access_token);
		} catch (error) {
			this.client.emit('wtf', error);
		}
	}

};
