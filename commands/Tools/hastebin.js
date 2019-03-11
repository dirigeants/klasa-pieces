// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['hb'],
			description: 'Upload code or text to hastebin.',
			usage: '<code:str>'
		});
	}

	async run(msg, [code]) {
		const key = await fetch('https://hastebin.com/documents', { method: 'POST', body: code })
			.then(response => response.json())
			.then(body => body.key);
		return msg.sendMessage(`https://hastebin.com/${key}`);
	}

};
