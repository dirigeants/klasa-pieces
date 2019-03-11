// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Monitor } = require('klasa');

module.exports = class extends Monitor {

	constructor(...args) {
		super(...args, {
			name: 'nomention',
			enabled: true,
			ignoreSelf: true
		});
	}

	run(msg) {
		if (msg.channel.type !== 'text') return;
		const user = `${msg.author.tag} (${msg.author.id})`;
		const channel = `#${msg.channel.name} (${msg.channel.id}) from ${msg.guild.name}`;

		if (msg.mentions.everyone) this.client.emit('log', `${user} mentioned everyone in ${channel}`);
		else if (msg.mentions.users.has(this.client.user.id)) this.client.emit('log', `${user} mentioned you in ${channel}`);
	}

};
