const { Monitor } = require('klasa');
const { remove } = require('confusables');

/*
*
* Requires "filtererdWords" guild setting.
* Client.defaultGuildSchema.add('filtererdWords', 'string', { default: [], array: true })
*
* This is a simple moderation filter setup. You may
* also want to: mute the person, log it to a logs
* channel in the guild, message the person telling
* them they said a prohibited word, and perform different
* checks and actions based on your requirements or needs.
* You may also exempt bots, staff, or certain channels
* from the filter.
*
* For the sake of simplicity, all these extra actions
* aren't done, as each bot will almost definitely want
* to do things differently.
*/

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, {
			ignoreOthers: false,
			ignoreBots: false,
			ignoreEdits: false
		});
	}

	async run(msg) {
		if (!msg.guild) return;

		const { content } = msg;
		if (!content || !content.length) return;
		const cleanContent = this.sanitize(content);

		const filtererdWords = msg.guild.settings.get('filtererdWords');
		if (!filtererdWords || !filtererdWords.length) return;

		// If they said a filtered word, this variable will be equal to that word.
		const hitTheFilter = filtererdWords.find(word => cleanContent.includes(this.sanitize(word)));
		if (!hitTheFilter) return;

		msg.delete();
	}

	sanitize(str) {
		return remove(str).toUpperCase();
	}

};
