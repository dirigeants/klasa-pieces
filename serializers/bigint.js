const { Serializer } = require('klasa');

module.exports = class extends Serializer {

	deserialize(data, piece, language) {
		if (data instanceof BigInt) return data;
		try {
			return BigInt(data);
		} catch (_) {
			throw language.get('RESOLVER_INVALID_INT', piece.key);
		}
	}

	serialize(data) {
		return data.toString();
	}

};
