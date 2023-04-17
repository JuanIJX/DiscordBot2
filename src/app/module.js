import url from "url"
import path from "path"
import { get as stackTraceGet } from "stack-trace"
import { Collection } from "discord.js";
import Logger, { Level } from "../libraries/logger.js";
import ConfigManager from "./manager/configmanager.js"
import DiscordManager from "./discordmanager.js";
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
		Object.defineProperty(this, 'configs', { value: new ConfigManager(this._path), enumerable: true });
		Object.defineProperty(this, 'eventList', { value: new Collection(), enumerable: true });

		// Functions

		this.log(Level.DEBUG, `Plugin ${this.name} instanciado`);
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
			await this.onEnable();
			this.log(Level.INFO, `Plugin '${this.name}' iniciado`);
			this._started = true;
		}
	};
	async stop() {
		if(this._started) {
			await this.onDisable();
			this.log(Level.INFO, `Plugin '${this.name}' detenido`);
			this._started = false;
		}
	};

	addConfig(...args) {
		this.configs.add(...args);
	}
}