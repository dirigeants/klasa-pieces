const { Command } = require('klasa');
const snekfetch = require('snekfetch');

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

		const res = await snekfetch.get(`https://min-api.cryptocompare.com/data/price?fsym=${c1}&tsyms=${c2}`).catch(() => {
			throw 'There was an error, please make sure you specified an appropriate coin and currency.';
		});
		if (!res.body[c2]) return msg.send('There was an error, please make sure you specified an appropriate coin and currency.');
		return msg.send(`Current price of ${amount} ${c1} is ${res.body[c2].toLocaleString()} ${c2}`);
	}

};
