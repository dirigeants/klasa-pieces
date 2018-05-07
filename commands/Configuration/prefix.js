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

	async run(msg, [prefix]) {
		if (prefix === 'reset') return this.reset(msg);
		if (msg.guild.configs.prefix === prefix) throw msg.language.get('CONFIGURATION_EQUALS');
		await msg.guild.configs.update('prefix', prefix);
		return msg.sendMessage(`The prefix for this guild has been set to ${prefix}`);
	}

	async reset(msg) {
		await msg.guild.configs.update('prefix', this.client.options.prefix);
		return msg.sendMessage(`Switched back the guild's prefix back to \`${this.client.options.prefix}\`!`);
	}

};
