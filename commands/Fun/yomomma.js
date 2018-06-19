const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['yomama'],

			description: 'Yo momma is so fat, yo.'
		});
	}

	async run(msg) {
		const joke = await fetch('http://api.yomomma.info')
			.then(response => response.json())
			.then(body => body.joke);
		return msg.sendMessage(`📢 **Yomomma joke:** *${joke}*`);
	}

};
