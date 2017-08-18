const { Command } = require('klasa');
const snekfetch = require('snekfetch');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Returns the current price of a Cryptocurrency Coin',
			usage: '<coin:str> <currency:str>',
			usageDelim: ' '
		});

		this.pieces = {
			type: 'commands',
			requiredModules: ['snekfetch']
		};
	}

	async run(msg, [coin, currency]) {
		const c1 = coin.toUpperCase();
		const c2 = currency.toUpperCase();

		const res = await snekfetch.get(`https://min-api.cryptocompare.com/data/price?fsym=${c1}&tsyms=${c2}`)
			.catch(() => { throw 'There was an error, please make sure you specified an appropriate coin and currency.'; });

		return msg.send(res.body[c2] ?
			`Current ${c1} price is ${res.body[c2]} ${c2}` :
			'There was an error, please make sure you specified an appropriate coin and currency.');
	}

};
