const { Extendable } = require('klasa');
const userRegex = new RegExp(/^(?:<@!?)?(\\d{17,19})>?$/);
module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		const matches = userRegex.exec(arg);
		if (matches) return this.user(arg, currentUsage, possible, repeat, msg);
		const search = arg.toLowerCase();
		let users = msg.client.users.filterArray(user => user.username.toLowerCase().includes(search) ||
		`${user.username.toLowerCase()}#${user.discriminator}`.includes(search));

		if (users.length === 1) return users[0];
		users = users.filter(user => user.username.toLowerCase() === search ||
		`${user.username.toLowerCase()}#${user.discriminator}` === search);

		if (users.length === 1) return users[0];
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (users.length > 15) throw 'Multiple users found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild mention, id or username`;
	}


};

