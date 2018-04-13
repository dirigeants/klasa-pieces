const { Task } = require('klasa');

module.exports = class extends Task {

	constructor(...args) {
		super(...args, { enabled: true });
	}

	async run() {
		/* I would recommend leaving this .send() in, as it checks if the bot can send a message to you.
		If not, it's more then likely that the API is down. Without this, it could result in deleting ALL users from the Database. */
		this.client.application.owner.send("I'm about to delete all users that are not longer fetchable by the API!").then(() => {
			let done = 0;
			let failed = 0;
			this.client.gateways.users.cache.keyArray().forEach(async user => {
				if (!this.client.users.fetch(user)) {
					this.client.gateways.users.getEntry(user).destroy()
						.then(() => done++)
						.catch(() => failed++);
				}
			});
			this.client.console.info(`Deleted ${done} users from the DB and failed on ${failed} users. ${this.client.gateways.users.cache.size} left.`);
		})
			.catch(err => this.client.console.error(`The user clean-up task has not run, as I could not send a message to the application owner. Error: ${err}`));
	}

};
