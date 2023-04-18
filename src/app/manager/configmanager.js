import path from "path"
import { Collection } from "discord.js";
import Config from "../../libraries/config.js";
export default class ConfigManager {
	constructor(path = "") {
		Object.defineProperty(this, '_path', { value: path });
		this._list = new Collection();
	}

	add(name, src, defaultData) {
		if(this._list.has(name))
			throw new Error(`La config ${name} ya existe`);
		this._list.set(name, new Config(path.join(this._path, src), defaultData));
	}

	get(name) {
		if(!this._list.has(name))
			throw new Error(`La config ${name} no existe`);
		return this._list.get(name);
	}
}