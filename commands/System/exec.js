const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 10,

			description: 'Execute commands in the terminal, use with EXTREME CAUTION.',
			usage: '<expression:str>'
		});
	}

	async run(msg, [code]) {
		const result = await this.client.methods.util.exec(code, { timeout: 30000 })
			.catch(error => ({ stdout: null, stderr: error && error.message ? error.message : error }));

		const output = result.stdout ? `**\`OUTPUT\`**${'```prolog'}\n${result.stdout}\n${'```'}` : '';
		const outerr = result.stderr ? `**\`ERROR\`**${'```prolog'}\n${result.stderr}\n${'```'}` : '';

		return msg.sendMessage([output, outerr].join('\n'));
	}

};
