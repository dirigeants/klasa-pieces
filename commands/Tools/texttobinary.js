const { Command } = require('klasa');

module.exports = class Binary extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Convert Discord Text to Binary!',
			usage: '<text:str>'
		});
	}

	async run(msg, [string]) {
		return msg.send(`\`\`\`\n${string.split('').map(char => char.charCodeAt(0).toString(2)).join(' ')}\n\`\`\``);
	}

};
