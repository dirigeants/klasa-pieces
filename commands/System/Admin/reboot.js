// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.

/*
 * In your main file, put:
 * Client.defaultClientSchema.add('restart', folder => folder
 *   .add('message', 'messagepromise')
 *   .add('timestamp', 'bigint', { min: 0 }));
 *
 * Uses the bigint and messagepromise serializers from https://github.com/dirigeants/klasa-pieces/tree/master/serializers
 *
 * If BigInt doesn't exist, update Node.js.
 */

const { Command } = require('klasa');

const DIGITS_TO_UNITS = new Map([
	[9, 's'],
	[6, 'ms'],
	[3, 'μs']
]);

const rebootKeys = ['message', 'timestamp'].map(key => `restart.${key}`);

const bigAbs = bigint => bigint < 0 ? -bigint : bigint;

const roundDigit = ([digit, otherDigit]) => Number(digit) + (otherDigit >= 5);

function getFriendlyDuration(from, to = process.hrtime.bigint()) {
	const time = bigAbs(to - from).toString();
	let shift, suffix;

	const digits = time.length;
	for (const [d, suf] of DIGITS_TO_UNITS) {
		if (digits > d) {
			shift = -d;
			suffix = suf;
			break;
		}
	}

	const whole = time.slice(0, shift);
	const fractional = `${time.slice(shift, shift + 1)}${roundDigit(time.slice(shift + 1, shift + 2))}`;
	return `${whole}.${fractional}${suffix}`;
}

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permissionLevel: 10,
			guarded: true,
			description: language => language.get('COMMAND_REBOOT_DESCRIPTION')
		});
	}

	async run(msg) {
		await Promise.all([
			...this.client.providers.map(provider => provider.shutdown()),
			this.client.settings.update({
				restart: {
					message: await msg.sendLocale('COMMAND_REBOOT'),
					timestamp: process.hrtime.bigint()
				}
			}).then(result => result.errors.length && this.client.emit('error', result.errors.join('\n')))
		]);
		process.exit();
	}

	async init() {
		// "message" needs to be awaited
		const [message, timestamp] = await Promise.all(rebootKeys.map(key => this._resolveSetting(key)));
		await this.client.settings.reset(rebootKeys);

		if (message) message.send(`✅ Successfully rebooted. (Took: ${timestamp && getFriendlyDuration(timestamp)})`);
		else this.client.emit('info', 'No restart channel');
	}

	_resolveSetting(path) {
		const { settings, languages: { default: language } } = this.client;

		const route = typeof path === 'string' ? path.split('.') : path;
		const piece = settings.gateway.schema.get(route);

		let objOrData = settings;
		for (const key of route) objOrData = objOrData[key];

		try {
			return piece.serializer.deserialize(objOrData, piece, language);
		} catch (err) {
			return undefined;
		}
	}

};
