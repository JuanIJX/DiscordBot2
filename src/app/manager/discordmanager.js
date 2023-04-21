import { Client, Guild, Message } from "discord.js"
import { Level } from "../../libraries/logger.js";
import intents from "../settings/intents.js"

Guild.prototype.fetchOrNull = async function(channelID) {
	try {
		return await this.channels.fetch(channelID);
	} catch (error) {
		return null;
	}
}

Message.prototype.tempReply = function(msgReply, time=-1, delOnlyReply=false) {
	return new Promise(async (resolve, reject) => {
		const msgObject = this;
		try {
			let reply = await msgObject.reply(msgReply);
			if(time >= 0) {
				setTimeout(async () => {
					await reply.delete();
					if(!delOnlyReply)
						await msgObject.delete();
					resolve();
				}, time);
			}
			else
				resolve();
		} catch (error) {
			reject(error);
		}
	});
}

export default class DiscordManager {
	constructor(logger, token) {
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_token', { value: token });
		Object.defineProperty(this, '_started', { value: null, writable: true });
		Object.defineProperty(this, 'discord', { value: new Client({ intents, disableMentions: 'everyone' }), enumerable: true });

		// Settings
		this.discord.on("error", error => {
			this.log(Level.ERROR, error.message);
			this.log(Level.DEBUG, error.stack);
		});
	}

	log(level, msg) { this._logger.log(level, "D-BOT", msg); }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }

	async start() {
		if(this._started === null) {
			this.log(Level.DEBUG, "Bot iniciando...");
			await this.discord.login(this._token);
			this._started = true;
			this.log(Level.DEBUG, "Bot de discord conectado");
		}
	}

	stop() {
		//this.discord.voice.connections.forEach(voiceConn => voiceConn.channel.leave());
		if(this._started === true) {
			this.discord.destroy();
			this._started = false;
			this.log(Level.DEBUG, "Bot de discord desconectado");
		}
	}
}