const { Command } = require('klasa');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

const suffixes = ['Bytes', 'KB', 'MB'];
const getBytes = (bytes) => {
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (!bytes && '0 Bytes') || `${(bytes / Math.pow(1024, i)).toFixed(2)} ${suffixes[i]}`;
};

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Shows the install/publish size of a cargo crate.',
			usage: '<name:str>'
		});
	}

	async run(msg, [name]) {
		const { crate, versions: [latest] } = await fetch(`https://crates.io/api/v1/crates/${encodeURIComponent(name)}`)
			.then(response => response.json())
			.catch(() => {
				throw 'There was an unexpected error. Try again later.';
			});

		if (!crate) throw 'That crate doesn\'t exist.';

		const embed = new MessageEmbed()
			.setColor(15051318)
			.setThumbnail('https://doc.rust-lang.org/cargo/images/Cargo-Logo-Small.png')
			.setTitle(name)
			.setURL(`https://crates.io/crates/${name}`)
			.setDescription(`${crate.description}

[Documentation](${crate.documentation}) - [Repository](${crate.repository})
			`)
			.addField('Total Downloads', crate.downloads.toLocaleString(), true)
			.addField('Categories', crate.categories.join(', '), true)
			.addField('Keywords', crate.keywords.join(', '), true)
			.addField('Latest Version', `
**Number:** ${latest.num}
**Size:** ${getBytes(latest.crate_size)}
**Downloads:** ${latest.downloads.toLocaleString()}
**License:** ${latest.license}
`, true);

		return msg.sendEmbed(embed);
	}

};
