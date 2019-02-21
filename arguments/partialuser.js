const { Argument } = require('klasa');

module.exports = class extends Argument {

	async run(arg) {
		const user = await this.resolveUser(arg, this.client.users);
		if (user) return user;
		throw `Please specify a valid user.`;
	}

	resolveUser(text, users, caseSensitive = false, wholeWord = false) {
		return users.get(text) || users.find(user => this.checkUser(text, user, caseSensitive, wholeWord));
	}

	checkUser(text, user, caseSensitive = false, wholeWord = false) {
		if (user.id === text) return true;
		const reg = /<@!?(\d{17,19})>/;
		const match = text.match(reg);
		if (match && user.id === match[1]) return true;
		text = caseSensitive ? text : text.toLowerCase();
		const username = caseSensitive ? user.username : user.username.toLowerCase();
		const discrim = user.discriminator;
		if (!wholeWord) {
			return username.includes(text) ||
			(username.includes(text.split('#')[0]) && discrim.includes(text.split('#')[1]));
		}
		return username === text ||
		(username === text.split('#')[0] && discrim === text.split('#')[1]);
	}

};
