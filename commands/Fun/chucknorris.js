// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['chucknorrisjoke'],
			description: 'Chuck Norris has some good jokes.'
		});
	}

	async run(msg) {
		const joke = await fetch('http://api.chucknorris.io/jokes/random')
			.then(response => response.json())
			.then(body => body.value);
		return msg.sendMessage(`**😁 Chuck Norris Joke:** ${joke}`);
	}

};
