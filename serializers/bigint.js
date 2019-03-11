// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
/* global BigInt:false */

const { Serializer } = require('klasa');

module.exports = class extends Serializer {

	deserialize(data, piece, language) {
		if (data instanceof BigInt) return data;
		try {
			// eslint-disable-next-line new-cap
			return BigInt(data);
		} catch (err) {
			throw language.get('RESOLVER_INVALID_INT', piece.key);
		}
	}

	serialize(data) {
		return data.toString();
	}

};
