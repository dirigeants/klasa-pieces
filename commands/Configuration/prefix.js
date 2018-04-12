const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 6,
			runIn: ['text'],
			cooldown: 5,
			description: 'Change the command prefix the bot uses in your server.',
			usage: '[reset] [prefix:str{1,4}]',
			subcommands: true
		});
	}

	async run(msg, [prefix]) {
		if (!prefix) return msg.send(`The current prefix for your guild is: \`${msg.guild.configs.prefix}\``);
		await msg.guild.configs.update('prefix', prefix, msg.guild);
		return msg.send(`<:checkmark:415894323436191755>  ::  Changed Command Prefix for **${msg.guild.name}** to \`${prefix}\``);
	}

	async reset(msg) {
		await msg.guild.configs.update('prefix', this.client.options.prefix, msg.guild);
		return msg.send(`<:checkmark:415894323436191755>  ::  Switched back the guild\'s prefix back to \`${this.client.options.prefix}\`!`);
	}

};