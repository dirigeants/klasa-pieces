const { Extendable } = require('klasa');
const channelRegex = new RegExp(/^(?:<#)?(\\d{17,19})>?$/);

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, ['ArgResolver'], { klasa: true });
	}

	async extend(arg, currentUsage, possible, repeat, msg) {
		const matches = channelRegex.exec(arg);
		if (matches) return this.channel(arg, currentUsage, possible, repeat, msg);
		const search = arg.toLowerCase();
		let channels = msg.guild.channels.filterArray(channel => channel.name.toLowerCase().indexOf(search));
		if (channels.length === 1) return channels[0];
		channels = channels.filter(channel => channel.name.toLowerCase() === search);
		if (channels.length === 1) return channels[0];
		if (currentUsage.type === 'optional' && !repeat) return null;
		if (channels.length > 15) throw 'Multiple channels found. Please be more specific.';
		throw `${currentUsage.possibles[possible].name} Must be a vaild name, id or mention`;
	}

};

