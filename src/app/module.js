import url from "url"
import path from "path"
import { get as stackTraceGet } from "stack-trace"
import Logger, { Level } from "../libraries/logger.js";
import ConfigManager from "./manager/configmanager.js"
import CommandManager from "./manager/commandmanager.js"
import EventManager from "./manager/eventmanager.js"
import DiscordManager from "./manager/discordmanager.js";
import { wait } from "../libraries/utils.mjs";
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
	}

	log(level, msg) { this._logger.log(level, this.name, msg); }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }
	get _defaultEmbed() {
		return {
			color: 0x00ff80,
			author: {
				name: "Pepino BOT",
				icon_url: "https://ideaschungas.com/uuuu.png",
			},
			thumbnail: {
				url: "https://ideaschungas.com/uuuu.png",
			},
			timestamp: new Date().toISOString(),
			footer: {
				text: "© IJX",
				icon_url: "https://ideaschungas.com/uuuu.png",
			},
		};
	}

	async _load(logger, discordManager, commandManager) {
		if(this._loaded === true)
			return;
		if(!(logger instanceof Logger))
			throw new Error(`Falta el elemento Logger en el plugin ${this.name}`);
		if(!(discordManager instanceof DiscordManager))
			throw new Error(`Falta el elemento Discord en el plugin ${this.name}`);
		if(!(commandManager instanceof CommandManager))
			throw new Error(`Falta el elemento CommandManager en el plugin ${this.name}`);

		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_loaded', { value: true });
		Object.defineProperty(this, '_commandManager', { value: commandManager, enumerable: true });
		Object.defineProperty(this, 'discordManager', { value: discordManager, enumerable: true });
		Object.defineProperty(this, 'configManager', { value: new ConfigManager(this._path), enumerable: true });
		Object.defineProperty(this, 'eventManager', { value: new EventManager(), enumerable: true });

		await this.onLoad();
	}
	
	async start() {
		if(!this._started) {
			this._commandManager.enableModule(this.name);
			await this.onEnable();
			this.log(Level.INFO, `Plugin '${this.name}' iniciado`);
			this._started = true;
		}
	}
	async stop() {
		if(this._started) {
			this._commandManager.disableModule(this.name);
			await this.onDisable();
			this.log(Level.INFO, `Plugin '${this.name}' detenido`);
			this._started = false;
		}
	}

	registerCommand(name, action) {
		try {
			this._commandManager.addCommand(name, this, action.bind(this));
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

	getEmbed(...objs) {
		return { embeds: objs.map(obj => obj.assign(this._defaultEmbed)) };
	}

	async onLoad() {}
	async onEnable() {}
	async onDisable() {}
}