const { Command } = require('klasa');
const snekfetch = require('snekfetch');
const wolframAppID = 'https://account.wolfram.com/auth/create';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 10,
			description: 'Query Wolfram Alpha with any mathematical question.',
			usage: '<query:str{1}>'
		});
	}

	async run(msg, [query]) {
		const { pods } = await snekfetch
			.get('http://api.wolframalpha.com/v2/query')
			.query('input', query)
			.query('primary', true)
			.query('appid', wolframAppID)
			.query('output', 'json')
			.then(res => JSON.parse(res.text).queryresult)
			.catch(() => msg.sendMessage('There was an error. Please try again.'));

		if (!pods || pods.error) throw "Couldn't find an answer to that question!";

		return msg.sendMessage(`
**Input Interpretation:** ${pods[0].subpods[0].plaintext}
**Result:** ${pods[1].subpods[0].plaintext.substring(0, 1500)}
`);
	}

};
