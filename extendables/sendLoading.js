// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Extendable } = require('klasa');
const { Message } = require('discord.js');

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, { appliesTo: [Message] });
	}

	/**
	 * @param {Function} cb The callback function to call in the middle
	 * @param {Object} [options] Extra options
	 * @param {string} [options.loadingText='Just a moment.'] Text to send before the callback
	 * @returns {Promise<KlasaMessage>} Resolves to the return of cb
	 */
	async sendLoading(cb, { loadingText = 'Just a moment.' } = {}) {
		const loadingMsg = await this.send(loadingText);
		const oldContent = loadingMsg.content;
		// eslint-disable-next-line callback-return
		const response = await cb(loadingMsg);
		// If the message was edited in cb, we don't wanna delete it
		if (!(response && response.id === loadingMsg.id) && oldContent === loadingMsg.content) await loadingMsg.delete();
		return response;
	}

	/**
	 * @param {(KlasaMessage|TextChannel)} channel The channel you intend to post in
	 * @param {Function} cb The callback function to call in the middle
	 * @param {Object} [options] Extra options
	 * @param {string} [options.loadingText='Just a moment.'] Text to send to this.channel before the callback
	 * @param {string} [options.doneText='Sent the image 👌'] Text to send to this.channel after the callback
	 * @returns {Promise<[KlasaMessage, KlasaMessage]>} Resolves to a confirmation message in this.channel and the return of cb
	 */
	async sendLoadingFor(channel, cb, {
		loadingText = 'Just a moment.',
		doneText = 'Sent the image 👌'
	} = {}) {
		await this.send(loadingText);
		// eslint-disable-next-line callback-return
		const response = await cb(channel);
		return [await this.send(doneText), response];
	}

};
