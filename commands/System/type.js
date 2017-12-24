const { Command, Stopwatch } = require('klasa');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			permLevel: 10,
			description: 'Get the type of given input',
			usage: '<code:string>',
			extendedHelp: 'Get the advanced types for given arbitrarily executed output'
		});
	}

	get util() {
		return this.client.methods.util;
	}

	async run(msg, [code]) {
		const stopwatch = new Stopwatch();
		const result = this.eval(msg, code);
		const evaled = stopwatch.friendlyDuration;
		stopwatch.restart();
		const type = this.util.isThenable(result) ?
			`${this.util.getTypeName(result)}<${this.getDeepTypes(await result.catch(error => error))}>` :
			this.getDeepTypes(result);
		const parsed = stopwatch.friendlyDuration;
		stopwatch.stop();

		return msg.sendMessage(`\`⏱ EXEC: ${evaled} | PARSE: ${parsed}\`  The type is: ${this.util.codeBlock('ts', type)}`);
	}

	getDeepTypes(result) {
		const basic = this.util.getTypeName(result);
		switch (basic) {
			case 'Map':
			case 'Collection':	{
				const typeKeys = new Set(),
					typeValues = new Set();
				for (const [key, value] of result) {
					const typeKey = this.getDeepTypes(key);
					if (!typeKeys.has(typeKey)) typeKeys.add(typeKey);
					const typeValue = this.getDeepTypes(value);
					if (!typeValues.has(typeValue)) typeValues.add(typeValue);
				}
				const typeK = typeKeys.size === 0 || typeKeys.has('Object') ? 'any' : Array.from(typeKeys).sort().join(' | ');
				const typeV = typeValues.size === 0 || typeValues.has('Object') ? 'any' : Array.from(typeValues).sort().join(' | ');

				return `${basic}<${typeK}, ${typeV}>`;
			}
			case 'Set':
			case 'Array': {
				const types = new Set();
				for (const value of result) {
					const type = this.getDeepTypes(value);
					if (!types.has(type)) types.add(type);
				}
				const typeV = types.size === 0 || types.has('Object') ? 'any' : Array.from(types).sort().join(' | ');

				return `${basic}<${typeV}>`;
			}
			default:
				return basic;
		}
	}

	eval(msg, code) {
		try {
			return eval(code);
		} catch (error) {
			return error;
		}
	}

};
