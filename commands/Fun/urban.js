// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Command, util: { toTitleCase } } = require('klasa');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

const ZWS = '\u200B';

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			aliases: ['ud', 'urbandictionary'],
			requiredPermissions: ['EMBED_LINKS'],
			description: 'Searches the Urban Dictionary library for a definition to the search term.',
			usage: '<query:string> [page:integer{0,10}]',
			usageDelim: ', ',
			nsfw: true
		});
	}

	async run(msg, [query, ind = 1]) {
		const index = ind - 1;
		if (index < 0) {
			throw 'The number cannot be zero or negative.';
		}

		const response = await fetch(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`);
		const { list } = await response.json();

		const result = list[index];
		if (typeof result === 'undefined') {
			throw index === 0 ?
				'I could not find this entry in UrbanDictionary' :
				'I could not find this page in UrbanDictionary, try a lower page index';
		}

		const definition = this.content(result.definition, result.permalink);
		return msg.sendEmbed(new MessageEmbed()
			.setTitle(`Word: ${toTitleCase(query)}`)
			.setURL(result.permalink)
			.setColor(msg.color)
			.setThumbnail('http://i.imgur.com/CcIZZsa.png')
			.setDescription([
				`→ \`Definition\` :: ${ind}/${list.length}\n${definition}`,
				`→ \`Example\` :: ${this.cutText(result.example, 750)}`,
				`→ \`Author\` :: ${result.author}`
			])
			.addField(ZWS, `\\👍 ${result.thumbs_up}`, true)
			.addField(ZWS, `\\👎 ${result.thumbs_down}`, true)
			.setFooter('© Urban Dictionary'));
	}

	content(definition, permalink) {
		if (definition.length < 750) return definition;
		return `${this.cutText(definition, 750)}... [continue reading](${permalink})`;
	}

	cutText(str, length) {
		if (str.length < length) return str;
		const cut = this.splitText(str, length - 3);
		if (cut.length < length - 3) return `${cut}...`;
		return `${cut.slice(0, length - 3)}...`;
	}

	splitText(str, length, char = ' ') {
		// eslint-disable-next-line id-length
		const x = str.substring(0, length).lastIndexOf(char);
		const pos = x === -1 ? length : x;
		return str.substring(0, pos);
	}

};
