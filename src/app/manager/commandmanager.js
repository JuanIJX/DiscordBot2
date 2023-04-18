import { Collection } from "discord.js";

export class Command {
	static create = () => {

	};

	constructor() {

	}
}

export default class CommandManager {
	constructor() {
		Object.defineProperty(this, '_list', { value: new Collection() });
	}
}