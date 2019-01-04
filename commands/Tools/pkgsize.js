const { Command } = require('klasa');
const fetch = require('node-fetch');

const suffixes = ['Bytes', 'KB', 'MB', 'GB'];
const getBytes = (bytes) => {
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return (!bytes && '0 Bytes') || `${(bytes / Math.pow(1024, i)).toFixed(2)} ${suffixes[i]}`;
};

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			description: 'Shows the install/publish size of a npm package.',
			usage: '<name:str>'
		});
	}

	async run(msg, [name]) {
		const { publishSize, installSize } = await fetch(`https://packagephobia.now.sh/api.json?p=${encodeURIComponent(name)}`)
			.then(response => response.json())
			.catch(() => {
				throw 'There was an unexpected error. Try again later.';
			});

		if (!publishSize && !installSize) throw 'That package doesn\'t exist.';

		return msg.send(`
<https://www.npmjs.com/package/${name}>

**Publish Size:** ${getBytes(publishSize)}
**Install Size:** ${getBytes(installSize)}
`);
	}

};
