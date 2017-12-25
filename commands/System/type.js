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
		const type = this.getKeyTypeNames(result);
		const parsed = stopwatch.friendlyDuration;
		stopwatch.stop();

		return msg.sendMessage(`\`⏱ EXEC: ${evaled} | PARSE: ${parsed}\`  The type is: ${this.util.codeBlock('ts',
			typeof type === 'string' ? type : this.drawTypeDescription('Complex', result, type))}`);
	}

	getKeyTypeNames(result) {
		if (!this.util.isObject(result)) return this.util.getDeepTypeName(result);

		const object = {};
		const keys = Object.getOwnPropertyNames(result);
		for (const key of keys) {
			object[key] = {
				name: key,
				descriptor: Object.getOwnPropertyDescriptor(result, key),
				isPublic: !key.startsWith('_')
			};
		}
		const proto = Object.getPrototypeOf(result);
		if (result === proto) return object;

		if (proto && proto.constructor && proto.constructor.name === 'Object') return object;
		const protoKeys = proto ? Object.getOwnPropertyNames(proto) : [];
		if (protoKeys.length > 0) {
			for (const key of protoKeys) {
				object[key] = {
					name: key,
					descriptor: Object.getOwnPropertyDescriptor(proto, key),
					isPublic: !key.startsWith('_')
				};
			}
		}

		return object;
	}

	drawTypeDescription(name, result, parsedObject) {
		const proto = Object.getPrototypeOf(result);
		const className = proto && proto.constructor && proto.constructor.name !== 'Object' ? proto.constructor.name : null;
		const output = [];
		for (const key of Object.keys(parsedObject)) {
			const { descriptor, isPublic } = parsedObject[key];
			if (descriptor.set) output.push(this.drawType(isPublic, 'set', key, descriptor.set));
			if (descriptor.get) output.push(this.drawType(isPublic, 'get', key, descriptor.get));
			if (descriptor.value) {
				if (typeof descriptor.value === 'function') output.push(this.drawType(isPublic, 'method', key, descriptor.value));
				else output.push(this.drawType(isPublic, null, key, descriptor.value));
			}
		}
		output.sort((a, b) => b.localeCompare(a));
		return (className ? `export class ${className} {\n` : `export type ${name} = {\n`) + output.join('\n') + (className ? '\n}' : '\n};');
	}

	drawType(accessorLevel, type, name, value) {
		if (type === 'set' || type === 'method') return `\t${accessorLevel ? 'public' : 'private'} ${type === 'set' ? 'set ' : ''}${name}${this.getFunctionParams(value)}: any;`;
		if (type === 'get') return `\t${accessorLevel ? 'public' : 'private'} readonly ${name}: any;`;
		return `\t${accessorLevel ? 'public' : 'private'} ${name}: ${this.util.getDeepTypeName(value)};`;
	}

	getFunctionParams(fn) {
		if (fn.length === 0) return '()';
		const fnStr = fn.toString();
		if (/\([^)]+\)/.test(fnStr)) return /\([^)]+\)/.exec(fnStr)[0];
		return '()';
	}

	eval(msg, code) {
		try {
			return eval(code);
		} catch (error) {
			return error;
		}
	}

};
