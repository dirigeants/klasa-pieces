const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'creates a reminder',
			usage: '<when:time> <text:str> [...]',
			usageDelim: ', '
		});
	}

	async run(msg, [when, ...text]) {
		const reminder = await this.client.schedule.create('reminder', when, {
			data: {
				channel: msg.channel.id,
				user: msg.author.id,
				text: text.join(', ')
			}
		});
		return msg.sendMessage(`Ok, I created you a reminder with the id: \`${reminder.id}\``);
	}

};
