const { Command, util } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 6,
			runIn: ['text'],
			requiredSettings: ['minAccAge'],

			description: 'Checks the guild for any user accounts younger than the minimum account age.'
		});
	}

	async run(msg) {
		const accAge = msg.guild.settings.minAccAge;
		const mtime = msg.createdTimestamp;

		const users = [];
		for (const member of msg.guild.members.values()) {
			if ((mtime - member.user.createdTimestamp) >= accAge) continue;
			users.push(`${member.user.tag}, Created:${((mtime - member.user.createdTimestamp) / 1000 / 60).toFixed(0)} min(s) ago`);
		}

		return msg.send(users.length > 0 ?
			`The following users are less than the Minimum Account Age:${util.codeBlock('', users.join('\n'))}` :
			'No users less than Minimum Account Age were found in this server.');
	}

	init() {
		if (!this.client.settings.guilds.schema.minAccAge) {
			return this.client.settings.guilds.add('minAccAge', { type: 'Integer', default: 1800000 });
		}
		return null;
	}

};
