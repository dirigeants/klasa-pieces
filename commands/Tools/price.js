// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command } = require('klasa');
const fetch = require('node-fetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Compares the value of a currency (crypto, fiat) with another.',
			usage: '<coin:str{1,3}> <currency:str{1,3}> [amount:int{1}]',
			usageDelim: ' '
		});
	}

	async run(msg, [coin, currency, amount = 1]) {
		const c1 = coin.toUpperCase();
		const c2 = currency.toUpperCase();

		const body = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${c1}&tsyms=${c2}`)
			.then(response => response.json())
			.catch(() => { throw 'There was an error, please make sure you specified an appropriate coin and currency.'; });
		if (!body[c2]) return msg.sendMessage('There was an error, please make sure you specified an appropriate coin and currency.');
		return msg.sendMessage(`Current price of ${amount} ${c1} is ${(body[c2] * amount).toLocaleString()} ${c2}`);
	}

};
