const { Command, RichDisplay, util } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['commands', 'cmds'],
			guarded: true,
			description: (message) => message.language.get('COMMAND_HELP_DESCRIPTION'),
			usage: '(Command:command)'
		});

		this.createCustomResolver('command', (arg, possible, message) => {
			if (!arg || arg === '') return undefined;
			return this.client.arguments.get('command').run(arg, possible, message);
		});
	}

	async run(message, [command]) {
		if (command) {
			const info = [
				`= ${command.name} = `,
				util.isFunction(command.description) ? command.description(message) : command.description,
				message.language.get('COMMAND_HELP_USAGE', command.usage.fullUsage(message)),
				message.language.get('COMMAND_HELP_EXTENDED'),
				util.isFunction(command.extendedHelp) ? command.extendedHelp(message) : command.extendedHelp
			].join('\n');
			return message.sendMessage(info, { code: 'asciidoc' });
		}

		if (message.channel.permissionsFor(this.client.user).has(['MANAGE_REACTIONS', 'MANAGE_MESSAGES'])) {
			return (await this.buildDisplay(message)).run(await message.send('Loading Commands...'));
		}

		const method = this.client.user.bot ? 'author' : 'channel';
		return message[method].send(await this.buildHelp(message), { split: { char: '\n' } })
			.then(() => { if (message.channel.type !== 'dm' && this.client.user.bot) message.sendMessage(message.language.get('COMMAND_HELP_DM')); })
			.catch(() => { if (message.channel.type !== 'dm' && this.client.user.bot) message.sendMessage(message.language.get('COMMAND_HELP_NODM')); });
	}

	async buildHelp(message) {
		const commands = await this._fetchCommands(message);
		const { prefix } = message.guildConfigs.prefix;

		const helpMessage = [];
		for (const [category, list] of commands) {
			helpMessage.push(`**${category} Commands**:\n`, list.map(this.formatCommand.bind(this, message, prefix)).join('\n'));
		}

		return helpMessage.join('\n');
	}

	async buildDisplay(message) {
		const commands = await this._fetchCommands(message);
		const { prefix } = message.guildConfigs.prefix;
		const display = new RichDisplay();
		for (const [category, list] of commands) {
			display.addPage(new MessageEmbed()
				.setTitle(`${category} Commands`)
				.setDescription(list.map(this.formatCommand.bind(this, message, prefix)).join('\n'))
			);
		}

		return display;
	}

	formatCommand(message, prefix, command) {
		const description = typeof command.description === 'function' ? command.description(message) : command.description;
		return `• **${prefix}${command.name}** → ${description}`;
	}

	async _fetchCommands(message) {
		const run = this.client.inhibitors.run.bind(this.client.inhibitors, message);
		const commands = new Map();
		await Promise.all(this.client.commands.map((command) => run(command, true)
			.then(() => {
				const category = commands.get(command.category);
				if (category) category.push(command);
				else commands.set(command.category, [command]);
			}).catch(() => {
				// noop
			})
		));

		return commands;
	}

};
