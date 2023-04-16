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
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_started', { value: false, writable: true });
		Object.defineProperty(this, 'configManager', { value: new ConfigManager(), enumerable: true });
		Object.defineProperty(this, 'eventList', { value: new Collection(), enumerable: true });

		// Functions

		this.log(Level.DEBUG, `Plugin ${this.name} instanciado`);
	}

	log(level, msg) { this._logger?.log(level, this.name, msg); }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }
	
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
}