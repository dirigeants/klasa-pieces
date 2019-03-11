// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command, Timestamp } = require('klasa');
const { MessageEmbed } = require('discord.js');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Get information on a mentioned user.',
			usage: '[Member:member]'
		});
		this.statuses = {
			online: '💚 Online',
			idle: '💛 Idle',
			dnd: '❤ Do Not Disturb',
			offline: '💔 Offline'
		};
		this.timestamp = new Timestamp('d MMMM YYYY');
	}

	run(msg, [member = msg.member]) {
		return msg.sendEmbed(new MessageEmbed()
			.setColor(member.displayHexColor || 0xFFFFFF)
			.setThumbnail(member.user.displayAvatarURL())
			.addField('❯ Name', member.user.tag, true)
			.addField('❯ ID', member.id, true)
			.addField('❯ Discord Join Date', this.timestamp.display(member.user.createdAt), true)
			.addField('❯ Server Join Date', this.timestamp.display(member.joinedTimestamp), true)
			.addField('❯ Status', this.statuses[member.presence.status], true)
			.addField('❯ Playing', member.presence.activity ? member.presence.activity.name : 'N/A', true)
			.addField('❯ Highest Role', member.roles.size > 1 ? member.roles.highest.name : 'None', true)
			.addField('❯ Hoist Role', member.roles.hoist ? member.roles.hoist.name : 'None', true));
	}

};
