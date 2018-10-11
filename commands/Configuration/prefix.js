const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['setPrefix'],
			cooldown: 5,
			description: 'Change the command prefix the bot uses in your server.',
			permissionLevel: 6,
			runIn: ['text'],
			usage: '[reset|prefix:str{1,10}]'
		});
	}

	async run(message, [prefix]) {
		if (!prefix) return message.send(`The prefix for this guild is \`${message.guild.settings.prefix}\``);
		if (prefix === 'reset') return this.reset(message);
		if (message.guild.settings.prefix === prefix) throw message.language.get('CONFIGURATION_EQUALS');
		await message.guild.settings.update('prefix', prefix);
		return message.send(`The prefix for this guild has been set to \`${prefix}\``);
	}

	async reset(message) {
		await message.guild.settings.reset('prefix');
		return message.send(`Switched back the guild's prefix back to \`${this.client.options.prefix}\`!`);
	}

};
