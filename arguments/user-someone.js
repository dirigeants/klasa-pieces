const { TextChannel } = require('discord.js');
const { Argument } = require('klasa');

module.exports = class extends Argument {

	constructor(...args) {
		super(...args, { name: 'user', aliases: ['mention'] });
	}

	async run(arg, possible, message) {
		let user = null;

		if (arg.trim().toLowerCase() === '@someone') {
			const maybeMember = message.channel instanceof TextChannel && message.channel.members.random();
			user = maybeMember ?
				maybeMember.user :
				Math.random() >= 0.5 ? this.client.user : message.author;
		} else if (Argument.regex.userOrMember.test(arg)) {
			user = await this.client.users.fetch(Argument.regex.userOrMember.exec(arg)[1]).catch(() => null);
		}

		if (user) return user;
		throw message.language.get('RESOLVER_INVALID_USER', possible.name);
	}

};
