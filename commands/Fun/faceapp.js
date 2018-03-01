const { Command } = require('klasa');
const { MessageAttachment } = require('discord.js');
const faceapp = require('faceapp');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 5,
			botPerms: ['ATTACH_FILES'],
			description: 'Applies a faceapp filter to an image.',
			usage: '<smile|smile_2|hot|old|young|female|female_2|male|pan|hitman|makeup|wave|glasses|bangs|hipster|goatee|lion|impression|heisenberg|hollywood>'
		});
	}

	async run(msg, [filter]) {
		if (!msg.attachments.first() || !msg.attachments.first().height) return msg.send('Please upload an image.');
		const image = await snekfetch
			.get(msg.attachments.first().url)
			.then(res => res.body)
			.catch(() => {
				throw "I couldn't find a wikipedia article with that title!";
			});

		const faceappImage = await faceapp
			.process(image, filter)
			.then(img => img)
			.catch(() => {
				throw "Error - Couldn't find a face in the image.";
			});

		return msg.send(new MessageAttachment(faceappImage, `${Math.round(Math.random() * 10000)}.jpg`));
	}

};
