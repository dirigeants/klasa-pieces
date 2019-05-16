// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const { obfuscate } = require('confusables');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			usage: '<str:str{1,200}>',
			description: 'Modify a string to have confusing letters in it.'
		});
	}

	async run(msg, [str]) {
		const variations = [];

		for (let i = 0; i < 5; i++) {
			variations.push(obfuscate(str));
		}

		return msg.send(variations.join('\n'));
	}

};
