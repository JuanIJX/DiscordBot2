import url from "url"
import path from "path"
import { get as stackTraceGet } from "stack-trace"
import Logger, { Level } from "../libraries/logger.js";
import ConfigManager from "./manager/configmanager.js"
import CommandManager from "./manager/commandmanager.js"
import SlashManager from "./manager/slashcommandmanager.js"
import EventManager from "./manager/eventmanager.js"
import DiscordManager from "./manager/discordmanager.js";
export default class Module {
	constructor() {
		// Variables
		Object.defineProperty(this, "_path", { value: path.relative(
			process.cwd(),
			url.fileURLToPath(
				path.dirname(
					stackTraceGet()
						.find(callSite => callSite.getFunctionName() === this.constructor.name)
						.getFileName()
				)
			)
		) });
		Object.defineProperty(this, '_started', { value: false, writable: true });
		Object.defineProperty(this, 'color', { value: 0xffffff, writable: true, enumerable: true });
	}

	log(level, msg) { this._logger.log(level, this.name, msg); }
	get thisPath() { return this._path; }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }
	get _defaultEmbed() {
		return {
			color: this.color,
			author: {
				name: this.discordManager.discord.user.tag,
				icon_url: this.discordManager.discord.user.displayAvatarURL(),
			},
			timestamp: new Date().toISOString(),
			footer: {
				text: "© IJX",
				icon_url: "https://ideaschungas.com/uuuu.png",
			}
		};
	}

	async _load(logger, discordManager, commandManager, slashManager) {
		if(this._loaded === true)
			return;
		if(!(logger instanceof Logger))
			throw new Error(`Falta el elemento Logger en el plugin ${this.name}`);
		if(!(discordManager instanceof DiscordManager))
			throw new Error(`Falta el elemento Discord en el plugin ${this.name}`);
		if(!(commandManager instanceof CommandManager))
			throw new Error(`Falta el elemento CommandManager en el plugin ${this.name}`);
		if(!(slashManager instanceof SlashManager))
			throw new Error(`Falta el elemento CommandManager en el plugin ${this.name}`);

		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_loaded', { value: true });
		Object.defineProperty(this, '_commandManager', { value: commandManager });
		Object.defineProperty(this, '_slashManager', { value: slashManager });
		Object.defineProperty(this, 'discordManager', { value: discordManager, enumerable: true });
		Object.defineProperty(this, 'configManager', { value: new ConfigManager(this._path), enumerable: true });
		Object.defineProperty(this, 'eventManager', { value: new EventManager(), enumerable: true });

		await this.onLoad();
	}
	
	async start() {
		if(!this._started) {
			this._commandManager.enableModule(this.name);
			this._slashManager.enableModule(this.name);
			await this.onEnable();
			this.log(Level.INFO, `Plugin '${this.name}' iniciado`);
			this._started = true;
		}
	}
	async stop() {
		if(this._started) {
			this._commandManager.disableModule(this.name);
			this._slashManager.disableModule(this.name);
			await this.onDisable();
			this.log(Level.INFO, `Plugin '${this.name}' detenido`);
			this._started = false;
		}
	}

	getEmbed(...objs) {
		return { embeds: objs.map(obj => obj.assign(this._defaultEmbed)) };
	}

	async onLoad() {}
	async onEnable() {}
	async onDisable() {}

	// Commands
	registerCommand(name, action) {
		try {
			this._commandManager.addCommand(name, this, action);
		} catch (error) {
			this.log(Level.ERROR, error.message);
		}
	}
	registerCommands(commands) {
		if(typeof(commands)!="object")
			throw new Error("Se esperaba un objeto como parámetro");
		for (const [key, value] of Object.entries(commands))
			this.registerCommand(key, value);
	}

	// Slash commands
	async registerSlash(data) {
		if(!data.hasOwnProperty("slash"))
			throw new Error("Falta la propiedad slash");
		if(!data.hasOwnProperty("execute"))
			throw new Error("Falta la propiedad execute");
		await this._slashManager.addCommand(this, data.slash, data.execute);
	}
}