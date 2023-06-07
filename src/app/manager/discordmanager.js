import { getVoiceConnection } from "@discordjs/voice";
import { Client, Collection, Message } from "discord.js"
import { Level } from "../../libraries/logger.js";
import intents from "../settings/intents.js"
import partials from "../settings/partials.js"
import { wait } from "../../libraries/utils.mjs";

// Mejoras de discord.js
Object.defineProperty(Message.prototype, `tempReply`, {
	value: function(msgReply, time=-1, delOnlyReply=false) {
		return new Promise(async (resolve, reject) => {
			const msgObject = this;
			try {
				const reply = await msgObject.reply(msgReply);
				if(time >= 0) {
					setTimeout(async () => {
						let x = await reply.delete();
						if(!delOnlyReply)
							await msgObject.delete();
						resolve(x);
					}, time);
				}
				else
					resolve(reply);
			} catch (error) {
				reject(error);
			}
		});
	},
	configurable: true, writable: true
});

Object.defineProperty(Collection.prototype, `forEachAsync`, {
	value: async function(fn, thisArg) {
		if (typeof fn !== 'function') throw new TypeError(`${fn} is not a function`);
		if (thisArg !== undefined) fn = fn.bind(thisArg);
		for (const [key, value] of this)
			await fn(value, key, this);
		return this;
	},
	configurable: true, writable: true
});


// Manager
export default class DiscordManager {
	constructor(logger, token) {
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_token', { value: token });
		Object.defineProperty(this, '_started', { value: null, writable: true });
		Object.defineProperty(this, "_timer", { value: { _destroyed: true }, writable: true });
		Object.defineProperty(this, 'discord', { value: new Client({ intents, partials, disableMentions: 'everyone' }), enumerable: true });
	}

	log(level, msg) { this._logger.log(level, "D-BOT", msg); }
	get id() { return this.discord.user.id; }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }

	async _waitReady() {
		return new Promise(resolve => {
			this._timer = setTimeout(() => {
				if(this.discord.isReady()) {
					this.log(Level.WARN, `Acabó conectado`);
					resolve();
				}
				else {
					this.log(Level.FATAL, `No se pudo conectar`);
					process.exit(1);
				}
			}, 10000);

			this.discord.once('ready', () => {
				if(this._timer._destroyed === false)
					clearTimeout(this._timer);
				this.log(Level.DEBUG, "Ready!");
				resolve();
			})
		});
	}

	async start() {
		if(this._started === null) {
			this.log(Level.DEBUG, "Iniciando...");
			await this.discord.login(this._token);
			this.log(Level.DEBUG, "Logueado");
			await this._waitReady();
			this._started = true;
			this.log(Level.INFO, "Bot de discord conectado");
		}
	}

	async stop() {
		//this.discord.voice.connections.forEach(voiceConn => voiceConn.channel.leave());
		if(this._started === true) {
			this.discord.guilds.cache.forEach(guild => {
				const voiceConnection = getVoiceConnection(guild.id);
				if(voiceConnection) {
					voiceConnection.destroy(true);
					this.log(Level.DEBUG, `VoiceConnection g(${guild.id}) destruído`);
				}
			});
			await wait(200);
			this.discord.voice.adapters.forEach(adapter => adapter.destroy());
			this.discord.destroy();
			this._started = false;
			this.log(Level.DEBUG, "Bot de discord desconectado");
		}
	}

	async clearCommands() {
		const fetchCommands = await this.discord.application.commands.fetch();
		for (let [_, value] of fetchCommands) {
			const appCommand = await this.discord.application.commands.delete(value);
			this.log(Level.DEBUG, `Slash command eliminado ${appCommand.name}(${appCommand.id}): ${appCommand.description}`);
		}
		this.log(Level.INFO, "Lista de slash commands vaciada");
	}
}