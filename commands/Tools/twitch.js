const { Command, Timestamp } = require('klasa');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

/**
 * https://dev.twitch.tv/docs/v5/guides/authentication/
 */
const clientID = 'CLIENT_ID_HERE';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Returns information on a Twitch.tv Account',
			usage: '<name:str>'
		});
		this.timestamp = new Timestamp('DD-MM-YYYY');
	}

	async run(msg, [twitchName]) {
		const body = await fetch(`https://api.twitch.tv/kraken/channels/${twitchName}?client_id=${clientID}`)
			.then(async res => await res.json())
			.catch(() => { throw 'Unable to find account. Did you spell it correctly?'; });

		const creationDate = this.timestamp.display(body.created_at);
		const embed = new MessageEmbed()
			.setColor(6570406)
			.setThumbnail(body.logo)
			.setAuthor(body.display_name, 'https://i.imgur.com/OQwQ8z0.jpg', body.url)
			.addField('Account ID', body._id, true)
			.addField('Followers', body.followers, true)
			.addField('Created On', creationDate, true)
			.addField('Channel Views', body.views, true);

		return msg.sendEmbed(embed);
	}

};
