const { Argument } = require('klasa');

module.exports = class extends Argument {

	constructor(...args) {
		super(...args, { name: 'member' });
	}

	async run(arg, possible, message) {
		let member = null;

		if (message.guild) {
			if (arg.trim().toLowerCase() === '@someone') {
				member = message.channel.members.random() || null;
			} else if (Argument.regex.userOrMember.test(arg)) {
				member = await message.guild.members.fetch(Argument.regex.userOrMember.exec(arg)[1]).catch(() => null);
			}
		}

		if (member) return member;
		throw message.language.get('RESOLVER_INVALID_MEMBER', possible.name);
	}

};
