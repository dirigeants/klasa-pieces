// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

/**
 * https://account.wolfram.com/auth/create
 */
const wolframAppID = 'CLIENT_ID_HERE';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Query Wolfram Alpha with any mathematical question.',
			usage: '<query:str>'
		});
	}

	async run(msg, [query]) {
		const url = new URL('http://api.wolframalpha.com/v2/query');
		url.search = new URLSearchParams([
			['input', query],
			['primary', true],
			['appid', wolframAppID],
			['output', 'json']
		]);

		const pods = await fetch(url)
			.then(response => response.json())
			.then(body => body.queryresult.pods)
			.catch(() => { throw 'There was an error. Please try again.'; });

		if (!pods || pods.error) throw "Couldn't find an answer to that question!";

		return msg.sendMessage([
			`**Input Interpretation:** ${pods[0].subpods[0].plaintext}`,
			`**Result:** ${pods[1].subpods[0].plaintext.substring(0, 1500)}`
		].join('\n'));
	}

};
