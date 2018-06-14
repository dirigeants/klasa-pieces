const { Command } = require('klasa');
const { post } = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['hb'],
			description: 'Upload code or text to hastebin.',
			usage: '<code:str>'
		});
	}

	async run(msg, [code]) {
		const { body } = await post('https://hastebin.com/documents').send(code);
		return msg.sendMessage(`https://hastebin.com/${body.key}`);
	}

};
