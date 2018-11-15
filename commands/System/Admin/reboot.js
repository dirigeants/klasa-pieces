// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
/* global BigInt */

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

const PRECISE_TIME = {
	MICROSECOND: 1000,
	MILLISECOND: 1000 ** 2,
	SECOND: 1000 ** 3
};

const rebootKeys = ['message', 'timestamp'].map(key => `restart.${key}`);

function bigAbs(bigint) {
	return bigint < 0 ? -bigint : bigint;
}

function truncateWithRound(numString, digits) {
	// eslint-disable-next-line eqeqeq
	if (digits == null) return numString;
	digits++;
	const strWithExtraDigit = numString.substring(0, digits).padEnd(digits, '0');
	const lastDigit = Number(strWithExtraDigit[strWithExtraDigit.length - 2]);
	const strSansLastDigit = strWithExtraDigit.slice(0, -2);
	return `${strSansLastDigit}${Number(strWithExtraDigit[strWithExtraDigit.length - 1]) >= 5 ? lastDigit + 1 : lastDigit}`;
}

function bigDivideToString(bigint, divisor, digits) {
	// eslint-disable-next-line new-cap
	divisor = BigInt(divisor);
	const intPart = bigint / divisor;
	const decPart = bigint - (intPart * divisor);
	return `${intPart}.${truncateWithRound(decPart.toString(), digits)}`;
}

function getFriendlyDuration(from, to = process.hrtime.bigint(), { digits = 2 } = {}) {
	const time = to - from;
	const absTime = bigAbs(time);
	if (absTime >= PRECISE_TIME.SECOND) return `${bigDivideToString(time, PRECISE_TIME.SECOND, digits)}s`;
	if (absTime >= PRECISE_TIME.MILLISECOND) return `${bigDivideToString(time, PRECISE_TIME.MILLISECOND, digits)}ms`;
	if (absTime >= PRECISE_TIME.MICROSECOND) return `${bigDivideToString(time, PRECISE_TIME.MICROSECOND, digits)}μs`;
	return `${time.toString()}ns`;
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
		const [message, timestamp] = await Promise.all(rebootKeys.map(key => this.resolveSetting(key)));
		await this.client.settings.reset(rebootKeys);

		if (message) message.send(`✅ Successfully rebooted. (Took: ${timestamp && getFriendlyDuration(timestamp)})`);
		else this.client.emit('info', 'No restart channel');
	}

	resolveSetting(path) {
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
