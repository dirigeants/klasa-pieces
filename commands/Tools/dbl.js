const { Command } = require('klasa');
const { MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 15,
			usage: '<target:user>',
			usageDelim: ''
		});
	}

	async run(msg, [target]) {
		let url = '';
		if (!target.bot) throw 'You need to provide a bot id and not a user one silly';
		const type = msg.flags.type ? String(msg.flags.type) : 'large';
		const icon = msg.flags.icon ? '?noavatar=true' : '';
		switch (type) {
			case 'large': url = `https://discordbots.org/api/widget/${target.id}.png`;
				break;
			case 'status': url = `https://discordbots.org/api/widget/status/${target.id}.png${icon}`;
				break;
			case 'servers': url = `https://discordbots.org/api/widget/servers/${target.id}.png${icon}`;
				break;
			case 'upvotes': url = `https://discordbots.org/api/widget/upvotes/${target.id}.png${icon}`;
				break;
			case 'lib': url = `https://discordbots.org/api/widget/lib/${target.id}.png${icon}`;
				break;
			case 'owner': url = `https://discordbots.org/api/widget/owner/${target.id}.png${icon}`;
				break;
			default: url = `https://discordbots.org/api/widget/${target.id}.png`;
		}
		const image = await fetch(url)
			.then(response => response.buffer())
			.catch(() => {
				throw 'I could not download the file. Can you try again with another image?';
			});
		return msg.send(new MessageAttachment(image, `${target.id}.png`));
	}

};
