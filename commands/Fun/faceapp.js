// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const { MessageAttachment } = require('discord.js');
const fetch = require('node-fetch');
const faceapp = require('faceapp');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			cooldown: 5,
			requiredPermissions: ['ATTACH_FILES'],
			description: 'Applies a faceapp filter to an image.',
			usage: '<smile|smile_2|hot|old|young|female|female_2|male|pan|hitman|makeup|wave|glasses|bangs|hipster|goatee|lion|impression|heisenberg|hollywood>',
			usageDelim: ' '
		});
	}

	async run(msg, [filter]) {
		const [attachment] = msg.attachments.values();
		if (!attachment || !attachment.height) throw 'Please upload an image.';

		const image = await fetch(attachment.url)
			.then(response => response.buffer())
			.catch(() => {
				throw 'I could not download the file. Can you try again with another image?';
			});

		const faceappImage = await faceapp
			.process(image, filter)
			.then(img => img)
			.catch(() => {
				throw "Error - Couldn't find a face in the image.";
			});

		return msg.sendMessage(new MessageAttachment(faceappImage, `${Math.round(Math.random() * 10000)}.jpg`));
	}

};
