const { Extendable } = require('klasa');
const { GuildMember, User, Message } = require('discord.js');
const userRegex = new RegExp(/^(?:<@!?)?(\\d{17,19})>?$/);
 module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		if (arg instanceof GuildMember) return arg.user;
		if (arg instanceof Message) return arg.author;
		const matches = userRegex.exec(arg);
		if (matches) {
			try {
				return await msg.client.users.fetch(matches[1]);
			} catch (err) {
				throw `${currentUsage.possibles[possible].name} Must be a vaild mention, id or username`;
			}
		}
		const search = arg.toLowerCase();
		let users = msg.client.users.filterArray(userFilterInexact(search));
		if (users.length === 1) return users[0];
		const exactUsers = users.filter(userFilterExact(search));
		if (exactUsers.length === 1) return exactUsers[0];
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (users.length > 15) throw 'Multiple users found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild mention, id or username`;
	}


};

function userFilterExact(search) {
	return user => user.username.toLowerCase() === search ||
		`${user.username.toLowerCase()}#${user.discriminator}` === search;
}

function userFilterInexact(search) {
	return user => user.username.toLowerCase().includes(search) ||
		`${user.username.toLowerCase()}#${user.discriminator}`.indexOf(search);
}

