const { Extendable } = require('klasa');
const roleRegex = new RegExp(/^(?:<@&)?(\\d{17,19})>?$/);
 module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		const matches = roleRegex.exec(arg);
		if (matches) return this.role(matches[1], msg.guild);
		const search = arg.toLowerCase();
		let roles = msg.guild.roles.filterArray(role => role.name.toLowerCase().indexOf(search));

		if (roles.length === 1) return roles[0];
		roles = roles.filter(role => role.name.toLowerCase() === search);

		if (roles.length === 1) return roles[0];
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (roles.length > 15) throw 'Multiple roles found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild name, id or mention`;
	}


};

