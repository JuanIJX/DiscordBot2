import { Collection, ChannelType } from "discord.js";
import Module from "../module.js";
import { wait } from "../../libraries/utils.mjs";

export default class CommandManager {
	constructor() {
		Object.defineProperty(this, '_enabledCmds', { value: new Set() });
		Object.defineProperty(this, '_availableCmds', { value: new Collection() });
	}

	enableModule(name) {
		this._availableCmds
			.filter(v => v.module.name == name)
			.forEach((v, key) => this._enabledCmds.add(key));
	}

	disableModule(name) {
		this._availableCmds
			.filter(v => v.module.name == name)
			.forEach((v, key) => this._enabledCmds.delete(key));
	}

	disableAll() {
		this._enabledCmds.clear();
	}

	addCommand(name, module, action, channels=null) {
		if(this._availableCmds.has(name))
			throw new Error(`No se pudo añadir el comando '${name}' porque ya existe`);
		if(!(module instanceof Module))
			throw new Error(`El segundo parámetro debe ser un módulo`);
		if(typeof(action) != "function")
			throw new Error(`El tercer parámetro debe ser una función`);
		if(channels != null && !Array.isArray(channels))
			throw new Error(`El cuarto parámetro debe ser NULL o un Array`);

		this._availableCmds.set(name, { module, channels, action });
	}

	handler(message) {
		if(message.content == "") return;
		if(message.channel.type == ChannelType.DM || message.channel.type == ChannelType.GroupDM) return;
		if(message.author.id == message.client.user.id) return;

		const [cmdName, ...args] = message.content.split(" ");
		if(this._enabledCmds.has(cmdName)) {
			const cmdData = this._availableCmds.get(cmdName);
			if(cmdData.channels == null || cmdData.channels.includes(message.channel.id))
				this._execCmd(cmdData.action.bind(cmdData.module), [message, cmdName, args.filter2(arg => arg != "")]);
		}
	}

	async _execCmd(cmdAction, params) {
		// Meter al usuario en lista negra para q no spamee el comando, la lista sera por cada guild y por user
		await cmdAction(...params);
		// await wait(500); // Tiempo de espera para este usuario
		// Sacar al usuario de la lista negra
	}
}