const { Extendable } = require('klasa');
const { GuildMember, User } = require('discord.js');
const memberRegex = new RegExp(/^(?:<@!?)?(\\d{17,19})>?$/);
 module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		if (arg instanceof User) return msg.guild.members.fetch(arg);
		const matches = memberRegex.exec(arg);
		if (matches) {
			try {
				return await msg.guild.members.fetch(await msg.client.users.fetch(matches[1]));
			} catch (err) {
				throw `${currentUsage.possibles[possible].name} Must be a vaild mention, id, username or display name`;
			}
		}
		const search = arg.toLowerCase();
		let members = msg.guild.members.filterArray(memberFilterInexact(search));
		if (members.length === 1) return members[0];
		const exactMembers = members.filter(memberFilterExact(search));
		if (exactMembers.length === 1) return exactMembers[0];
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (members.length > 15) throw 'Multiple members found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild mention, id, username or display name`;
	}


};


function memberFilterExact(search) {
	return mem => mem.user.username.toLowerCase() === search ||
		(mem.nickname && mem.nickname.toLowerCase() === search) ||
		`${mem.user.username.toLowerCase()}#${mem.user.discriminator}` === search;
}

function memberFilterInexact(search) {
	return mem => mem.user.username.toLowerCase().includes(search) ||
		(mem.nickname && mem.nickname.toLowerCase().includes(search)) ||
		`${mem.user.username.toLowerCase()}#${mem.user.discriminator}`.indexOf(search);
}

