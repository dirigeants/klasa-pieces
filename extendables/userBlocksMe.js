const { Extendable } = require('klasa');
const { User, GuildMember } = require('discord.js');

const EMOJI_ID = '🤖';

module.exports = class extends Extendable {

	constructor(...args) {
		super(...args, { appliesTo: [User, GuildMember] });
	}

	async blocksMe(context) {
		const user = this.user || this;

		if (user.id === this.client.user.id) return false;

		const { dmChannel } = user;
		if (dmChannel) {
			const dms = await dmChannel.messages.fetch({ limit: 100 }, false);
			const maybeMsg = dms.find(dm => dm.author.id === this.id);
			if (maybeMsg) {
				if (await maybeMsg.react(EMOJI_ID).then(() => true, () => false)) {
					maybeMsg.reactions.remove(EMOJI_ID);
					return false;
				} else {
					return true;
				}
			}
		}

		if (context.guild) {
			const blocksMeInGuild = this._blocksMeInGuild(context.guild, context.channel);
			if (blocksMeInGuild !== undefined) return blocksMeInGuild;
		}

		for (const guild of this.client.guilds.values()) {
			const blocksMeInGuild = this._blocksMeInGuild(guild);
			if (blocksMeInGuild !== undefined) return blocksMeInGuild;
		}

		return undefined;
	}

	async _blocksMeInGuild(guild, contextChannel) {
		let maybeMsg;

		if (contextChannel) {
			const msgs = await contextChannel.messages.fetch({ limit: 100 }, false);
			maybeMsg = msgs.find(m => m.author != null && m.author.id === this.id);
			if (maybeMsg && !maybeMsg.reactable) maybeMsg = undefined;
		}

		if (!maybeMsg) {
			const channels = guild.channels.filter(contextChannel ?
				c => c.type === 'text' && c.id !== contextChannel.id :
				c => c.type === 'text');

			for (const channel of channels.values()) {
				const msgs = await channel.messages.fetch({ limit: 100 }, false);
				maybeMsg = msgs.find(m => m.author != null && m.author.id === this.id);
				if (maybeMsg) {
					if (maybeMsg.reactable) break;
					maybeMsg = undefined;
				}
			}
		}

		if (!maybeMsg) return undefined;

		return maybeMsg.react(EMOJI_ID).then(() => false, () => true);
	}

};
