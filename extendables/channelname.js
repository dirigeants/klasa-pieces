const { Extendable } = require('klasa');
const { GuildChannel } = require('discord.js');
const channelRegex = new RegExp(/^(?:<#)?(\\d{17,19})>?$/);
 module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		if (arg instanceof GuildChannel) return arg;
		const matches = channelRegex.exec(arg);
		if (matches && msg.guild.channels.has(matches[1])) return msg.guild.channels.get(matches[1]) || null;
		const search = arg.toLowerCase();
		let channels = msg.guild.channels.filterArray(channelFilterInexact(search));
		if (channels.length === 1) return channels[0];
		const exactChannels = channels.filter(channelFilterExact(search));
		if (exactChannels.length === 1) return exactChannels[0];
		if (exactChannels.length > 0) channels = exactChannels;
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (channels.length > 15) throw 'Multiple channels found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild name, id or mention`;
	}


};

function channelFilterExact(search) {
	return channel => channel.name.toLowerCase() === search;
}

function channelFilterInexact(search) {
	return channel => channel.name.toLowerCase().includes(search);
}
