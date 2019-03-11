// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const figletAsync = require('util').promisify(require('figlet'));

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Creates an ASCII banner from the string you supply.',
			usage: '<banner:str>'
		});
	}

	async run(msg, [banner]) {
		return msg.sendCode('', await figletAsync(banner));
	}

};
