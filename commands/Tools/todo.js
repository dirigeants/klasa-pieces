/*
To your main server file, add:
Client.defaultUserSchema
  .add("TODOs", "any", {array: true, default: [], configurable: true});
*/

const { Command } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			enabled: true,
			runIn: ['dm'],
			requiredPermissions: [],
			requiredSettings: [],
			aliases: [],
			autoAliases: true,
			bucket: 1,
			cooldown: 0,
			promptLimit: 0,
			promptTime: 30000,
			guarded: false,
			permissionLevel: 0,
			description: 'add|remove|list user\'s TODOs through DM',
			extendedHelp: 'No extended help available.',
			usage: '<add|remove|list> (TODO:string) [content:...string]',
			usageDelim: ' ',
			quotedStringSupport: false,
			subcommands: true
		});
		//
		this.createCustomResolver('string', (arg, possible, message, [action]) => {
			if (action === 'list') return arg;
			return this.client.arguments.get('string').run(arg, possible, message);
		});
	}

	async add(message, [TODO, content]) {
		await message.author.settings.update('TODOs', [...message.author.settings.TODOs, [TODO, content]], { action: 'overwrite' });
		return message.send(`Added \`${TODO}\` TODO`);
	}

	async remove(message, [TODO]) {
		const filtered = message.author.settings.TODOs.filter(([name]) => name !== TODO);
		await message.author.settings.update('TODOs', filtered, { action: 'overwrite' });
		return message.send(`Removed \`${TODO}\` TODO`);
	}

	list(message) {
		return message.send(`TODOs for this author are: ${message.author.settings.TODOs.map(key => `\n${key}`)}`);
	}

};
