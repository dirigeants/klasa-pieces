const { Command } = require('klasa');

const snekfetch = require('snekfetch');
const moment = require('moment');
require('moment-duration-format');

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

		this.pieces = {
			type: 'commands',
			requiredModules: ['snekfetch', 'moment', 'moment-duration-format']
		};
	}

	async run(msg, [twitchName]) {
		const body = await snekfetch.get(`https://api.twitch.tv/kraken/channels/${twitchName}?client_id=${clientID}`)
			.then(res => res.body)
			.catch(() => { throw 'Unable to find account. Did you spell it correctly?'; });

		const creationDate = moment(body.created_at).format('DD-MM-YYYY');
		const embed = new this.client.methods.Embed()
			.setColor(6570406)
			.setThumbnail(body.logo)
			.setAuthor(body.display_name, 'https://i.imgur.com/OQwQ8z0.jpg', body.url)
			.addField('Account ID', body._id, true)
			.addField('Followers', body.followers, true)
			.addField('Created On', creationDate, true)
			.addField('Channel Views', body.views, true);

		return msg.send({ embed });
	}

};
