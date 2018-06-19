const { Command, Timestamp } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['star'],
			permissionLevel: 6,
			runIn: ['text'],
			requiredSettings: ['starboard'],

			description: 'Stars a message.',
			usage: '<messageid:msg>'
		});

		this.provider = null;
		this.timestamp = new Timestamp('DD/MM/YYYY [@] HH:mm:ss');
	}

	async run(msg, [message]) {
		const channel = this.getChannel(msg.guild);
		await this.sendStar(msg, message, channel);
		await message.react('⭐').catch(() => null);
		return msg.sendMessage('Successfully starred!');
	}

	async sendStar(msg, message, channel) {
		if (!await this.provider.has('starboard', message.guild.id)) await this.provider.set('starboard', message.guild.id, JSON.stringify([]));

		const msgArray = await this.provider.get('starboard', message.guild.id);
		if (msgArray.includes(message.id)) throw 'This message has already been starred.';
		else if (msg.author === message.author) throw 'You cannot star yourself.';

		const options = {};
		if (message.attachments.first()) options.files = message.attachments.map(a => ({ name: a.filename, attachment: a.url }));

		await channel.send(this.generateMessage(message), options);
		msgArray.push(message.id);
		await this.provider.update('starboard', message.guild.id, { messages: JSON.stringify(msgArray) });
	}

	getChannel(guild) {
		const channel = guild.channels.find('name', 'starboard');
		if (!channel) throw 'Please create the _starboard_ channel and try again.';
		if (channel.postable === false) throw `I require the permission SEND_MESSAGES to post messages in ${channel} channel.`;
		return channel;
	}

	generateMessage(message) {
		const starTime = this.timestamp.display(message.createdTimestamp);
		const starFooter = `${message.author.tag} in #${message.channel.name} (ID: ${message.id})`;
		return `⭐ ${message.cleanContent}\n\n- ${starTime} by ${starFooter}`;
	}

	async init() {
		this.provider = this.client.providers.default;

		if (!await this.provider.hasTable('starboard')) {
			const SQLCreate = ['id TEXT NOT NULL UNIQUE', "messages TEXT NOT NULL DEFAULT '[]'"];
			await this.provider.createTable('starboard', SQLCreate);
		}
	}

};
