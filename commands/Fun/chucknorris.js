const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['chucknorrisjoke'],

			description: 'Chuck Norris has some good jokes.'
		});
	}

	async run(msg) {
		const { body } = await snekfetch.get('http://api.chucknorris.io/jokes/random');

		return msg.sendMessage(`**😁 Chuck Norris Joke:** ${body.value}`);
	}

};
