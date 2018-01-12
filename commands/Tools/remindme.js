const { Command, util: { codeBlock } } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'creates a reminder',
			aliases: ['remind', 'reminder'],
			usage: '[when:time] [text:str] [...]',
			usageDelim: ', '
		});
	}

	async run(msg, [when, ...text]) {
		if (msg.flags.list) {
			const reminders = this.client.schedule.tasks.filter(task => task.taskName === 'reminder' && task.data.user === msg.author.id);
			if (reminders.length === 0) throw 'You have no pending reminders currently.';

			const send = [];
			for (let i = 0; i < reminders.length; i++) {
				send.push(`[${i + 1}] ${reminders[i].id} :: ${reminders[i].data.text || 'No text'}`);
			}

			return msg.send(`**Your reminders**: ${codeBlock('asciidoc', send.join('\n'))}`);
		}

		if (msg.flags.delete) {
			return this.client.schedule.delete(msg.flags.delete)
				.then(() => msg.send('Succesfully removed reminder.'))
				.catch(() => msg.send('This reminder ID does not exist.'));
		}

		if (msg.flags.clear) {
			const promises = [];
			const reminders = this.client.schedule.tasks.filter(task => task.taskName === 'reminder' && task.data.user === msg.author.id);
			if (reminders.length === 0) throw 'You have no reminders.';
			for (const reminder of reminders) promises.push(this.client.schedule.delete(reminder.id));

			return Promise.all(promises)
				.then(() => msg.send(`Deleted ${reminders.length} reminders. ðŸ‘Œ`));
		}

		if (!when || text.length === 0) throw 'You must specify a time and reminder.';
		const reminder = await this.client.schedule.create('reminder', when, {
			data: {
				channel: msg.channel.id,
				user: msg.author.id,
				text: text.join(', ')
			}
		});
		return msg.send(`Ok, I created you a reminder with the id: \`${reminder.id}\``);
	}

};
