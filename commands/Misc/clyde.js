const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class Clyde extends Command {

	constructor(...args) {
		super(...args, {
			requiredPermissions: ['SEND_MESSAGES', 'MANAGE_WEBHOOKS'],
			description: 'It seems that Clyde has something to say.',
			usage: '<text:string{1,100}>'
		});
	}

	async run(msg, [content]) {
		const webhook = await msg.channel.createWebhook('CIyde', { avatar: 'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png' });
		return snekfetch.post(`https://canary.discordapp.com/api/webhooks/${webhook.id}/${webhook.token}`)
			.send({ content })
			.then(() => {
				webhook.delete();
			})
			.catch((err) => {
				console.log(err);
				return webhook.delete('Error occured when running.');
			});
	}

};
