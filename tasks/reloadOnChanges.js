const { Task, Colors } = require('klasa');
const { watch } = require('chokidar');

module.exports = class extends Task {

	async run(name) {
		await Promise.all(this.client.pieceStores
			.filter(store => store.name !== 'providers')
			.map(async (store) => {
				await store.loadAll();
				await store.init();
			}));

		if (this.client.shard) {
			await this.client.shard.broadcastEval(`
        if (this.shard.id !== ${this.client.shard.id}) {
					this.client.pieceStores
						.filter(store => store.name !== 'providers')
						.map(async (store) => {
		          await store.loadAll();
		          await store.init();
	        	});
				}
      `);
		}

		return this.client.emit('log', `${name} was updated. Reloaded all piece stores.`);
	}

	async init() {
		const { _fileChangeWatcher, reloadStoresOnChange } = this.client;
		if (!reloadStoresOnChange || _fileChangeWatcher) return;

		this.client._fileChangeWatcher = watch(process.cwd(), {
			ignored: (path) => path.includes('node_modules') || path.includes('bwd/provider'),
			persistent: true,
			ignoreInitial: true
		});

		const reloadAllStores = (path) => {
			const pathArray = path.split(`${process.cwd()}\\`)[1];
			this.run(new Colors({ text: 'green' }).format(pathArray));
		};

		['add', 'change', 'unlink']
			.map(event => this.client._fileChangeWatcher.on(event, reloadAllStores));
	}

};
