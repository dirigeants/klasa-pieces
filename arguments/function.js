const { Argument } = require('klasa');

module.exports = class extends Argument {

	run(arg, possible, msg) {
		const functions = this.client.functions.get(arg.toLowerCase());
		if (functions) return functions;
		throw (msg.language || this.client.languages.default).get('RESOLVER_INVALID_PIECE', possible.name, 'function');
	}

};
