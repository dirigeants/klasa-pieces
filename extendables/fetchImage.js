const { Extendable } = require('klasa');

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, { appliesTo: ['GroupDMChannel', 'DMChannel', 'TextChannel'] });
	}

	async extend() {
		const messageBank = await this.messages.fetch({ limit: 20 });

		for (const message of messageBank.values()) {
			const fetchedAttachment = message.attachments.first();
			if (fetchedAttachment && fetchedAttachment.height) {
				return fetchedAttachment;
			}
		}

		throw `Couldn't find an image.`;
	}

};
