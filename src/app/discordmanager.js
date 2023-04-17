import { Client, Collection } from "discord.js"
import { Level } from "../libraries/logger.js";
import intents from "./settings/intents.js"

export default class DiscordManager {
	constructor(logger, token) {
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_token', { value: token });
		Object.defineProperty(this, '_started', { value: null, writable: true });
		Object.defineProperty(this, '_discord', { value: new Client({ intents, disableMentions: 'everyone' }) });

		// Settings
		this._discord.on("error", error => {
			this.log(Level.ERROR, error.message);
			this.log(Level.DEBUG, error.stack);
		});
	}

	log(level, msg) { this._logger.log(level, "D-BOT", msg); }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }
	get discord() { return this._discord; }

	async start() {
		if(this._started === null) {
			this.log(Level.DEBUG, "Bot iniciando...");
			await this._discord.login(this._token);
			this._started = true;
			this.log(Level.DEBUG, "Bot de discord conectado");
		}
	}

	stop() {
		//this._discord.voice.connections.forEach(voiceConn => voiceConn.channel.leave());
		if(this._started === true) {
			this._discord.destroy();
			this._started = false;
			this.log(Level.DEBUG, "Bot de discord desconectado");
		}
	}
}