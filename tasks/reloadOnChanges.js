const { Task, Stopwatch } = require('klasa');
const { watch } = require('chokidar');
const path = require('path');

module.exports = class extends Task {

	async run(name, piece) {
		const timer = new Stopwatch();

		await this.client.commands.get('reload')
			.run({ sendLocale: () => null }, [piece]);

		timer.stop();
		return this.client.emit('log', `${name} was updated. Reloaded it in ${timer}`);
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

		const reloadStore = (name) => {
			const store = name.split(path.sep)
				.find(dir => this.client.pieceStores.has(dir));

			if (!store) return;

			name = path.basename(name);
			const piece = this.client.pieceStores.get(store)
				.get(name.replace(path.extname(name), ''));

			this.run(name, piece);
		};

		['add', 'change', 'unlink']
			.map(event => this.client._fileChangeWatcher.on(event, reloadStore));
	}

};
