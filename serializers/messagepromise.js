// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Message } = require('discord.js');
const { Serializer } = require('klasa');

module.exports = class extends Serializer {

	deserialize(data, piece, language, guild) {
		if (data instanceof Message) return data;
		if (typeof data !== 'string') throw this.constructor.error(language, piece.key);
		const [channelID, messageID] = data.split('/', 2);
		if (!(channelID && messageID)) throw this.constructor.error(language, piece.key);

		const channel = this.client.serializers.get('channel').deserialize(channelID,
			{ key: piece.key, type: 'textchannel' }, language, guild);
		const messagePromise = this.constructor.regex.snowflake.test(messageID) ? channel.messages.fetch(messageID) : null;
		if (messagePromise) return messagePromise;
		// Yes, the split is supposed to be text, not code
		throw language.get('RESOLVER_INVALID_MESSAGE', `${piece.key}.split('/')[1]`);
	}

	serialize(data) {
		return `${data.channel.id}/${data.id}`;
	}

	stringify(data, channel) {
		// channel might be a message, I sure as heck don't know
		return ((channel.messages || channel.channel.messages).get(data) || { content: (data && data.content) || data }).content;
	}

	static error(language, name) {
		// Yes, the split is supposed to be text, not code
		return [
			language.get('RESOLVER_INVALID_CHANNEL', `${name}.split('/')[0]`),
			language.get('RESOLVER_INVALID_MESSAGE', `${name}.split('/')[1]`)
		].join(' ');
	}

};
