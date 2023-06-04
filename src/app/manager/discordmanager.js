import { getVoiceConnection } from "@discordjs/voice";
import { Client, Guild, Message } from "discord.js"
import { Level } from "../../libraries/logger.js";
import intents from "../settings/intents.js"
import partials from "../settings/partials.js"
import { wait } from "../../libraries/utils.mjs";

Guild.prototype.fetchChannelOrNull = async function(channelID) {
	try {
		return await this.channels.fetch(channelID);
	} catch (error) {
		return null;
	}
}

Guild.prototype.fetchMemberOrNull = async function(memberID) {
	try {
		return await this.members.fetch(memberID);
	} catch (error) {
		return null;
	}
}

Message.prototype.tempReply = function(msgReply, time=-1, delOnlyReply=false) {
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
}

export default class DiscordManager {
	constructor(logger, token) {
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_token', { value: token });
		Object.defineProperty(this, '_started', { value: null, writable: true });
		Object.defineProperty(this, 'discord', { value: new Client({ intents, partials, disableMentions: 'everyone' }), enumerable: true });

		// Settings
		this.discord.on("error", error => {
			this.log(Level.ERROR, error.message);
			this.log(Level.DEBUG, error.stack);
		});
	}

	log(level, msg) { this._logger.log(level, "D-BOT", msg); }
	get id() { return this.discord.user.id; }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }

	async _waitReady() {
		return new Promise(resolve => this.discord.once('ready', resolve));
	}

	async start() {
		if(this._started === null) {
			this.log(Level.DEBUG, "Bot iniciando...");
			await this.discord.login(this._token);
			await this._waitReady();
			this._started = true;
			this.log(Level.DEBUG, "Bot de discord conectado");
		}
	}

	async stop() {
		//this.discord.voice.connections.forEach(voiceConn => voiceConn.channel.leave());
		if(this._started === true) {
			this.discord.guilds.cache.forEach(guild => {
				const voiceConnection = getVoiceConnection(guild.id);
				if(voiceConnection) {
					voiceConnection.destroy(true);
					this.log(Level.DEBUG, `VoiceConnection ${guild.id} destruído`);
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