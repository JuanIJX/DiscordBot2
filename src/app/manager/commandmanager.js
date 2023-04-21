import { Collection, ChannelType } from "discord.js";

export default class CommandManager {
	constructor(discordManager) {
		Object.defineProperty(this, '_discordManager', { value: discordManager });
		Object.defineProperty(this, '_availableCmds', { value: new Collection() });
		Object.defineProperty(this, '_enabledCmds', { value: new Set() });
	}

	enableModule(name) {
		this._availableCmds.filter(v => v.module.name == name).forEach((v, key) => this._enabledCmds.add(key));
	}

	disableModule(name) {
		this._availableCmds.filter(v => v.module.name == name).forEach((v, key) => this._enabledCmds.delete(key));
	}

	disableAll() {
		this._enabledCmds.clear();
	}

	addCommand(name, module, data) {
		if(this._availableCmds.has(name))
			throw new Error(`No se pudo añadir el comando '${name}' porque ya existe`);
		this._availableCmds.set(name, {
			module,
			channels: null,
			data
		});
	}

	commandHandler(message) {
		if(message.content == "") return;
		if(message.channel.type == ChannelType.DM || message.channel.type == ChannelType.GroupDM) return;
		if(message.author.id == this._discordManager.discord.user.id) return;

		const [cmdName, ...args] = message.content.split(" ");
		if(this._enabledCmds.has(cmdName)) {
			this._execCmd(this._availableCmds.get(cmdName), [
				message,
				cmdName,
				args.filter2(arg => arg != "")
			]);
		}
	}

	async _execCmd(cmd, params) {
		if(typeof(cmd.data)=="function") {
			await cmd.data(...params);
			/*if(response !== undefined)
				params[0].channel.send(response);*/
		}
	}
}