const { Command } = require('klasa');
const fetcg = require('node-fetch');

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
		return fetch(`https://canary.discordapp.com/api/webhooks/${webhook.id}/${webhook.token}`, {
			method: 'POST',
			body: JSON.stringify(content),
			headers: { 'Content-Type': 'application/json' }
		})
		.then(() => {
			webhook.delete();
		})
		.catch((err) => {
			console.log(err);
			return webhook.delete('Error occured when running.');
		});
	}

};
