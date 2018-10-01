const { Command } = require('klasa');

    /* You need to add the following lines to your guild schematic manager:
     	.add('selfroles', folder => folder
		    .add('roles', 'role', { array: true })
            .add('enabled', 'boolean', { default: true }))
            
    */

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			runIn: ['text'],
			cooldown: 10,
			aliases: ['toggleselfrole', 'enableselfroles', 'disableselfroles'],
			permissionLevel: 6,
			requiredPermissions: ['USE_EXTERNAL_EMOJIS'],
			description: language => language.get('COMMAND_TOGGLE_SELFROLES'),
			extendedHelp: 'No extended help available.'
		});
	}

	async run(msg) {
		const current = msg.guild.settings.get('selfroles.enabled');
		msg.guild.settings.update('selfroles.enabled', !current);
		if (current) {
			return msg.send(`｢ **Self Roles** ｣ Self Roles have been globally disabled. Happy Hunting for Inertia!`);
		} else {
			return msg.send(`｢ **Self Roles** ｣ Self Roles has been globally enabled. Seems like we got 'em! :)`);
		}
	}

};
