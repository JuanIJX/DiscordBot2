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
	constructor(logger, discordManager ) {
		if(!(logger instanceof Logger))
			throw new Error(`Falta el elemento Logger en el plugin ${this.name}`);
		if(!(discordManager instanceof DiscordManager))
			throw new Error(`Falta el elemento Discord en el plugin ${this.name}`);


		// Variables

		Object.defineProperty(this, "_path", { value: this._getPluginPath() });
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_started', { value: false, writable: true });
		Object.defineProperty(this, 'discord', { value: discordManager, enumerable: true });
		Object.defineProperty(this, 'configs', { value: new ConfigManager(this._path), enumerable: true });
		Object.defineProperty(this, 'commands', { value: new CommandManager(), enumerable: true });
		Object.defineProperty(this, 'events', { value: new EventManager(), enumerable: true });
	}

	log(level, msg) { this._logger?.log(level, this.name, msg); }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }
	_getPluginPath() {
		return path.relative(
			process.cwd(),
			url.fileURLToPath(
				path.dirname(
					stackTraceGet()
						.find(callSite => callSite.getFunctionName() === this.constructor.name)
						.getFileName()
				)
			)
		);
	}
	
	async start() {
		if(!this._started) {
			if(typeof(this.onEnable) == "function")
				await this.onEnable();
			this.log(Level.INFO, `Plugin '${this.name}' iniciado`);
			this._started = true;
		}
	}

	async stop() {
		if(this._started) {
			if(typeof(this.onDisable) == "function")
				await this.onDisable();
			this.log(Level.INFO, `Plugin '${this.name}' detenido`);
			this._started = false;
		}
	}

	addConfig(...args) {
		this.configs.add(...args);
	}
}