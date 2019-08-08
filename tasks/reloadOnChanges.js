// Copyright (c) 2017-2019 dirigeants. All rights reserved. MIT license.
const { Task, Stopwatch } = require('klasa');
const { watch } = require('chokidar');
const { extname, basename, sep } = require('path');

const nodeModules = `${sep}node_modules${sep}`;

/*
* When any piece file is changed in your bot (e.g. when you `git pull`, or just edit a file),
* this piece will automatically reload that piece so the change is instantly updated into
* your bot. Test this piece on a test bot before using it in production.
*/

module.exports = class extends Task {

	async run(name, _path, piece) {
		const timer = new Stopwatch();

		for (const module of Object.keys(require.cache)) {
			if (!module.includes(nodeModules) && extname(module) !== '.node') {
				delete require.cache[module];
			}
		}

		let log;
		const reload = this.client.commands.get('reload');
		if (piece) {
			await reload.run({ sendLocale: () => null, sendMessage: () => null }, [piece]);
			log = `Reloaded it in ${timer}`;
		} else {
			await reload.everything({ sendLocale: () => null, sendMessage: () => null });
			log = `Reloaded everything in ${timer}.`;
		}

		timer.stop();
		this.client.emit('log', `${name} was updated. ${log}`);
	}

	async init() {
		if (this.client._fileChangeWatcher) return;

		this.client._fileChangeWatcher = watch(process.cwd(), {
			ignored: [
				'**/node_modules/**/*',
				'**/bwd/provider/**/*'
			],
			persistent: true,
			ignoreInitial: true,
			cwd: process.cwd()
		});

		const reloadStore = async (_path) => {
			const store = _path.split(sep)
				.find(dir => this.client.pieceStores.has(dir));

			const name = basename(_path);

			if (!store) {
				if (this._running) return;
				this._running = true;
				await this.run(name, _path);
				this._running = false;
				return;
			}

			const piece = this.client.pieceStores.get(store)
				.get(name.replace(extname(name), ''));

			this.run(name, _path, piece);
		};

		for (const event of ['add', 'change', 'unlink']) {
			this.client._fileChangeWatcher.on(event, reloadStore);
		}
	}

};
