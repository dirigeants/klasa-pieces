const { Event, Colors } = require('klasa');

const HEADER = new Colors({ text: 'red' });

module.exports = class extends Event {

	run({ timeout, limit, method, route }) {
		this.client.emit('verbose', [
			`${HEADER.format('[RATELIMIT]')}`,
			`Timeout: ${timeout}ms`,
			`Limit: ${limit} requests`,
			`Method: ${method.toUpperCase()}`,
			`Route: ${route}`
		]);
	}

};
