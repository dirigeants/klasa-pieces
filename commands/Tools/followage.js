const { Command } = require('klasa');
const snekfetch = require('snekfetch');
const { MessageEmbed } = require('discord.js');

/**
 * https://dev.twitch.tv/docs/v5/guides/authentication/
 */
const clientID = 'CLIENT_ID_HERE';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 2,
			description: 'Shows the followage of a given user from a given twitch channel.',
			usage: '<name:str> <channel:str>',
			usageDelim: ' '
		});
	}

	async run(msg, [twitchName, channelName]) {
		const [days, logo] = await snekfetch
			.get(`https://api.twitch.tv/kraken/users/${twitchName}/follows/channels/${channelName}`)
			.query('client_id', clientID)
			.then(res => [this.differenceDays(new Date(res.body.created_at), new Date()), res.body.channel.logo])
			.catch(() => msg.send(`${twitchName} isn't following ${channelName}, or it is banned, or doesn't exist at all.`));

		const embed = new MessageEmbed()
			.setColor(6570406)
			.setAuthor(`${twitchName} has been following ${channelName} for ${days} days.`, logo);
		return msg.sendEmbed({ embed });
	}
	differenceDays(first, second) {
		return parseInt((second - first) / (1000 * 60 * 60 * 24));
	}

};
