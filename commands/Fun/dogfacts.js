// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, { description: 'Gives you a random dog fact.' });
	}

	async run(msg) {
		const fact = await fetch(`http://dog-api.kinduff.com/api/facts?number=1`)
			.then(response => response.json())
			.then(body => body.facts[0]);
		return msg.sendMessage(`📢 **Dogfact:** *${fact}*`);
	}

};
