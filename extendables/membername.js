const { Extendable } = require('klasa');
const memberRegex = new RegExp(/^(?:<@!?)?(\\d{17,19})>?$/);
module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		const matches = memberRegex.exec(arg);
		if (matches) return this.member(arg, currentUsage, possible, repeat, msg);

		const search = arg.toLowerCase();
		let members = msg.guild.members.filterArray(mem => mem.user.username.toLowerCase().indexOf(search) ||
		(mem.nickname && mem.nickname.toLowerCase().indexOf(search)) ||
		`${mem.user.username.toLowerCase()}#${mem.user.discriminator}`.indexOf(search));

		if (members.length === 1) return members[0];
		members = members.filter(mem => mem.user.username.toLowerCase() === search ||
		(mem.nickname && mem.nickname.toLowerCase() === search) ||
		`${mem.user.username.toLowerCase()}#${mem.user.discriminator}` === search);

		if (members.length === 1) return members[0];
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (members.length > 15) throw 'Multiple members found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild mention, id, username or display name`;
	}


};

