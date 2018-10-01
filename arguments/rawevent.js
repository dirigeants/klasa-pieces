const { Argument } = require('klasa');

module.exports = class extends Argument {

	run(arg, possible, msg) {
		const rawEvent = this.client.rawEvents.get(arg.toLowerCase());
		if (rawEvent) return rawEvent;
		throw (msg.language || this.client.languages.default).get('RESOLVER_INVALID_PIECE', possible.name, 'rawEvent');
	}

};
