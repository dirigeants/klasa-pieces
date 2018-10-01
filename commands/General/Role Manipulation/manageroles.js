const { Command } = require('klasa');
const { RichDisplay } = require('klasa');
const { MessageEmbed } = require('discord.js');

    /* You need to add the following lines to your guild schematic manager:
     	.add('selfroles', folder => folder
		    .add('roles', 'role', { array: true })
            .add('enabled', 'boolean', { default: true }))
            
    */

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			runIn: ['text'],
			requiredPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'MANAGE_ROLES'],
			aliases: ['selfrole', 'iam'],
			cooldown: 5,
			permissionLevel: 0,
			description: language => language.get('COMMAND_SELFROLES'),
			extendedHelp: 'No extended help available.',
			usage: '<add|remove|list> [role:rolename]',
			usageDelim: ' ',
			subcommands: true
		});
	}

	async list(msg) {
		const { roles } = msg.guild.settings.selfroles;
		if (!roles.length) return msg.send(`｢ **Error** ｣ This guild does not have any self assignable roles.`);
		const pages = new RichDisplay(new MessageEmbed()
			.setTitle('Use the reactions to change pages, select a page, or stop viewing the roles')
			.setAuthor('Self Roles', msg.author.displayAvatarURL())
			.setDescription('Scroll between pages to see the self assignable roles.')
			.setColor('#2C2F33')
		);
		pages.addPage(tab => tab.setDescription(roles.map(role => `\`-\` ${msg.guild.roles.get(role) || 'Role Removed'}`).join('\n')));

		return pages.run(await msg.send(`｢ **Loading** ｣ Loading Roles...`), {
			time: 120000,
			filter: (reaction, user) => user === msg.author
		});
	}

	async add(msg, [role]) {
		const { roles } = msg.guild.settings.selfroles;
		if (!roles || !role) return msg.send(`｢ **Error** ｣ This guild does not have any roles to give or you did not provide any valid roles to give yourself.`);
		if (!roles.includes(role.id)) return msg.send(`｢ **Error** ｣ That given role is not self assignable do \`${msg.guildSettings.prefix}roleme list\` to know all the self assignable roles.`);

		const myRole = msg.guild.me.roles.highest;
		if (role.position > myRole.position) return msg.send(`｢ **Error** ｣ That role is higher in position than I am, so I will do nothing.`);
		if (msg.member.roles.has(role)) return msg.send(`｢ **Error** ｣ You already have that role do \`${msg.guildSettings.prefix}roleme remove ${role.name}\` to remove it.`);

		if (this.roleCheck(msg)) return msg.send('｢ **Error** ｣ You can only have one colored role enabled at any time.');
		const assigned = await msg.member.roles.add(role, 'Self Assigned').catch(() => null);
		if (!assigned) return msg.send(`｢ **Error** ｣ There was an error, please try again later.`);
		return msg.send(`｢ **RoleMe** ｣ The role has been assigned.`);
	}

	async remove(msg, [role]) {
		const { roles } = msg.guild.settings.selfroles;
		if (!roles || !role) return msg.send(`｢ **Error** ｣ This guild does not have any roles to give or you did not provide any valid roles to give yourself.`);
		if (!roles.includes(role.id)) return msg.send(`｢ **Error** ｣ That given role is not self assignable do \`${msg.guildSettings.prefix}roleme list\` to know all the self assignable roles.`);

		const myRole = msg.guild.me.roles.highest;
		if (role.position > myRole.positon) return msg.send(`｢ **Error** ｣ That given role is above my role in the guild, please change the order.`);
		if (!msg.member.roles.has(role.id)) return msg.send(`｢ **Error** ｣ You don't have that role do \`${msg.guildSettings.prefix}roleme add ${role.name}\` to add it.`);
		const assigned = await msg.member.roles.remove(role, 'Self Deassigned').catch(() => null);
		if (!assigned) return msg.send(`｢ **Error** ｣ There was an error, please try again later.`);
		return msg.send(`｢ **RoleMe** ｣ The role has been deassigned.`);
	}

	roleCheck(msg) {
		const memberRoles = msg.member.roles.map(roleRole => roleRole.id);
		const { roles } = msg.guild.settings.selfroles;

		var ret = [];
		for (var i in memberRoles) {
			if (roles.indexOf(memberRoles[i]) > -1) {
				ret.push(memberRoles[i]);
			}
		}
		return Boolean(ret.length >= 1);
	}

};
