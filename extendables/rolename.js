const { Extendable } = require('klasa');
const { Role } = require('discord.js');
const roleRegex = new RegExp(/^(?:<@&)?(\\d{17,19})>?$/);
 module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		if (!msg.guild) return null;
		const matches = roleRegex.exec(arg);
		if (matches) return msg.guild.roles.get(matches[1]) || null;
		const search = arg.toLowerCase();
		let roles = msg.guild.roles.filterArray(roleFilterInexact(search));
		if (roles.length === 1) return roles[0];
		const exactRoles = roles.filter(roleFilterExact(search));
		if (exactRoles.length === 1) return exactRoles[0];
		if (exactRoles.length > 0) roles = exactRoles;
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (roles.length > 15) throw 'Multiple roles found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild name, id or mention`;
	}


};

function roleFilterExact(search) {
	return role => role.name.toLowerCase() === search;
}

function roleFilterInexact(search) {
	return role => role.name.toLowerCase().indexOf(search);
}
