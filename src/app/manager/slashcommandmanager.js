import { Collection, ChannelType, SlashCommandBuilder } from "discord.js";
import Module from "../module.js";

class CommandInfo {
	constructor(slashManager, appCommand, module, action) {
		Object.defineProperty(this, '_slashManager', { value: slashManager });
		Object.defineProperty(this, '_appCommand', { value: appCommand });
		Object.defineProperty(this, '_module', { value: module });
		Object.defineProperty(this, '_action', { value: action });
	}

	get id() { return this._appCommand.id }
	get name() { return this._appCommand.name }
	get module() { return this._module }
	get action() { return this._action }

	enable() {
		this._slashManager.enableCommand(this.name);
		return this;
	}

	disable() {
		this._slashManager.disableCommand(this.name);
		return this;
	}

	async delete() {
		this._slashManager.deleteById(this.id);
	}
}

export default class SlashManager {
	constructor(logger) {
		Object.defineProperty(this, '_logger', { value: logger });

		// Array sin repetición con los nombres de los comandos habilitados
		Object.defineProperty(this, '_enabledCmds', { value: new Set() });
		// Información asociada a los comandos Collection<String ApplicationCommand.name, CommandInfo }>
		Object.defineProperty(this, '_infoCmds', { value: new Collection() });
	}

	async load(applicationCommandManager) {
		// client.application.commands
		Object.defineProperty(this, '_appCmdManager', { value: applicationCommandManager });
	}

	// Obtención
	async getAppCmdFromId(id) {
		return await this._appCmdManager.fetch(id).catch(() => null);
	}
	async getAppCmdFromName(name) {
		if(this._infoCmds.has(name))
			return null;
		return await this._appCmdManager.fetch(this._infoCmds.get(name)).catch(() => null);
	}

	// Carga / eliminación
	async clear() {
		for (let [_, value] of (await this._appCmdManager.fetch()))
			await value.delete();
		this._enabledCmds.clear();
		this._infoCmds.clear();
	}
	async deleteById(id) {
		const appCommand = await this.getAppCmdFromId(id);
		if((await appCommand.delete().catch(() => null)) instanceof ApplicationCommand) {
			this._enabledCmds.delete(appCommand.name);
			this._infoCmds.delete(appCommand.name);
		}
	}
	async deleteByName(name) {
		const appCommand = await this.getAppCmdFromName(name);
		if((await appCommand.delete().catch(() => null)) instanceof ApplicationCommand) {
			this._enabledCmds.delete(name);
			this._infoCmds.delete(name);
		}
	}
	async deleteAloneCommands() {
		for (let [_, value] of (await this._appCmdManager.fetch()))
			if(!this._infoCmds.find(infoCmd => infoCmd.id == value.id))
				await value.delete();

	}
	async addCommand(module, slashCommandBuilder, action) {
		if(!(module instanceof Module))
			throw new Error(`El primer parámetro debe ser un módulo`);
		if(!(slashCommandBuilder instanceof SlashCommandBuilder))
			throw new Error(`El segundo parámetro debe ser un SlashCommandBuilder`);
		if(this._infoCmds.has(slashCommandBuilder.name))
			throw new Error(`No se pudo añadir el comando '${slashCommandBuilder.name}' porque ya existe`);
		if(typeof(action) != "function")
			throw new Error(`El tercer parámetro debe ser una función`);

		const appCommand = await this._appCmdManager.create(slashCommandBuilder);
		const commandInfo = new CommandInfo(this, appCommand, module, action);
		this._infoCmds.set(slashCommandBuilder.name, commandInfo)
		return commandInfo;
	}

	// Activación / desactivación
	enableCommand(name) {
		if(!this._infoCmds.has(name))
			throw new Error("Comando inexistente");
		this._enabledCmds.add(name);
	}
	disableCommand(name) {
		this._enabledCmds.delete(name);
	}
	enableModule(name) {
		this._infoCmds.filter(v => v.module.name == name).forEach(infoCmd => infoCmd.enable());
	}
	disableModule(name) {
		this._infoCmds.filter(v => v.module.name == name).forEach(infoCmd => infoCmd.disable());
	}
	disableAll() {
		this._enabledCmds.clear();
	}

	// Controladores
	handler(interaction) {
		if(!interaction.isChatInputCommand()) return;
		if(interaction.channel.type == ChannelType.DM || interaction.channel.type == ChannelType.GroupDM) return;
		if(interaction.user.id == interaction.client.user.id) return;

		if(!this._infoCmds.has(interaction.commandName))
			_execCmd(interaction, () => "Comando desconocido", []);
		else if(!this._enabledCmds.has(interaction.commandName))
			_execCmd(interaction, () => "Comando desactivado", []);
		else {
			const infoAppCommand = this._infoCmds.get(interaction.commandName);
			if(interaction.commandId != infoAppCommand.id)
				_execCmd(interaction, () => "ID de comando erróneo", []);
			else
				_execCmd(interaction, infoAppCommand.action.bind(infoAppCommand.module), [interaction]);
		}	
	}
}

async function _execCmd(interaction, action, params) {
	// Meter al usuario en lista negra para q no spamee el comando, la lista sera por cada guild y por user
	const response = await action(...params);
	if(response !== undefined)
		await interaction.reply(response);
	// await wait(500); // Tiempo de espera para este usuario + la espera de ejecutar su solicitud
	// Sacar al usuario de la lista negra
}