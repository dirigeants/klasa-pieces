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
		const { body } = await fetch('https://hastebin.com/documents', { method: 'POST', body: code });
		return msg.sendMessage(`https://hastebin.com/${body.key}`);
	}

};
