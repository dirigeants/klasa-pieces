const { Command } = require('klasa');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const querystring = require('querystring');

/**
 * https://dev.twitch.tv/docs/v5/guides/authentication/
 */
// eslint-disable-next-line camelcase
const qs = querystring.stringify({ client_id: 'CLIENT_ID_HERE' });

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Shows the followage of a given user from a given twitch channel.',
			usage: '<name:str> <channel:str>',
			usageDelim: ' '
		});
	}

	async run(msg, [twitchName, channelName]) {
		const body = await fetch(`https://api.twitch.tv/kraken/users/${twitchName}/follows/channels/${channelName}?${qs}`)
			.then(response => response.json())
			.catch(() => { throw `${twitchName} isn't following ${channelName}, or it is banned, or doesn't exist at all.`; });
		const days = this.differenceDays(new Date(body.created_at), new Date());
		return msg.sendEmbed(new MessageEmbed()
			.setColor(6570406)
			.setAuthor(`${twitchName} has been following ${channelName} for ${days} days.`, body.channel.logo));
	}

	differenceDays(first, second) {
		return (second - first) / (1000 * 60 * 60 * 24);
	}

};
