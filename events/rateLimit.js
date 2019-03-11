// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Event, Colors } = require('klasa');

/**
 * KlasaConsoleConfig#useColor must be
 * enabled in order to use this piece.
 */

const HEADER = new Colors({ text: 'red' }).format('[RATELIMIT]');

module.exports = class extends Event {

	run({ timeout, limit, method, route }) {
		this.client.emit('verbose', [
			HEADER,
			`Timeout: ${timeout}ms`,
			`Limit: ${limit} requests`,
			`Method: ${method.toUpperCase()}`,
			`Route: ${route}`
		].join('\n'));
	}

};
