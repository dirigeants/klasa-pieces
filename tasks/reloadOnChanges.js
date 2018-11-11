const { Task, Stopwatch } = require('klasa');
const { watch } = require('chokidar');
const path = require('path');

module.exports = class extends Task {

	async run(name, _path, piece) {
		const timer = new Stopwatch();

		for (const module in require.cache) {
			if (module.split(path.sep).includes('node_modules')) continue;
			if (path.extname(module) === '.node') continue;
			delete require.cache[module];
		}

		let log;
		const reload = this.client.commands.get('reload');
		if (piece) {
			await reload.run({ sendLocale: () => null }, [piece]);
			log = `Reloaded it in ${timer}`;
		} else {
			await reload.everything({ sendLocale: () => null });
			log = `Reloaded everything in ${timer}.`;
		}

		timer.stop();
		return this.client.emit('log', `${name} was updated. ${log}`);
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

		const reloadStore = (_path) => {
			const store = _path.split(path.sep)
				.find(dir => this.client.pieceStores.has(dir));

			const name = path.basename(_path);

			if (!store) return this.run(name, _path);

			const piece = this.client.pieceStores.get(store)
				.get(name.replace(path.extname(name), ''));

			return this.run(name, _path, piece);
		};

		['add', 'change', 'unlink']
			.map(event => this.client._fileChangeWatcher.on(event, reloadStore));
	}

};
