const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['givepat'],
			description: 'Pat someone',
			usage: '<person:user>'
		});
	}

	async run(msg, [person]) {
		const { body } = await snekfetch.get('https://nekos.life/api/v2/img/pat');
		return msg.sendMessage(`✋ | ***${person}, You have recieved a pat from ${msg.author}!***`, { files: [body.url] });
	}

};
