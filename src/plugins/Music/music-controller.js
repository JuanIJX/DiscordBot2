import { Level } from "../../libraries/logger.js";
import { Player, EqualizerConfigurationPreset, GuildQueueEvent, PlayerEvent } from "./DiscordPlayer.cjs"
import { DefaultExtractors  } from "./DiscordPlayerExtractor.cjs"
import PlaylistManager from "./myplaylist.js";
import Queue2 from "./queueown.js";
import { YoutubeiExtractor } from "discord-player-youtubei"

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = function (...args) {
	const message = args.join(" ");
	if (message.includes("[YOUTUBEJS][Text]: Unable to find matching run")) return;
	originalConsoleLog.apply(console, args);
};

console.error = function (...args) {
	const message = args.join(" ");
	if (message.includes("[YOUTUBEJS][Text]: Unable to find matching run")) return;
	originalConsoleError.apply(console, args);
};
export default class MusicController {
	constructor(module) {
		Object.defineProperty(this, "module", { value: module, enumerable: true });
		Object.defineProperty(this, "player", { value: new Player(this.module.discordManager.discord, {
			autoRegisterExtractor: false,
			ytdlOptions: { quality: "highestaudio", highWaterMark: 1 << 25 }
		}), enumerable: true });
		this.player.extractors.register(YoutubeiExtractor, {});
		Object.defineProperty(this, "_config", { value: this.module.configManager.get("queue").content });
		Object.defineProperty(this, "playlistManager", { value: new PlaylistManager(this) });
	}

	async load() {
		await this.player.extractors.loadMulti(DefaultExtractors);

		this.player.events.on(GuildQueueEvent.playerStart, (queue, track) => this.module.log(Level.DEBUG, `(g: ${queue.id}) Canción iniciada '${track.title}'`));
		this.player.events.on(GuildQueueEvent.playerFinish, (queue, track) => this.module.log(Level.DEBUG, `(g: ${queue.id}) Canción finalizada '${track.title}'`));
		if(this._config?.debug?.player === true)
			this.player.on(PlayerEvent.debug, msg => console.log(msg));
		if(this._config?.debug?.queue === true)
			this.player.events.on(GuildQueueEvent.debug, (queue, msg) => console.log(`${queue.id} ${msg}`));
	}

	/**
	 * 
	 */
	async destroy() {
		await this.player.destroy();
		this.module.log(Level.DEBUG, "Player destroyed");
	}

	/**
	 * Get song or playlist from string or URL
	 * 
	 * @param {string} cad URL o cadena de búsqueda
	 * @returns Promise<SearchResult>
	 */
	search(cad, options={}) {
		return this.player.search(cad, options);
	}
	
	/**
	 * Create queue if no exist
	 * 
	 * @param {import("discord.js/typings/index.js").Snowflake} guildID ID of guild
	 * @returns Queue
	 */
	createQueue(guild) {
		return this._createQueue(guild, {
			leaveOnEmpty: false,
			leaveOnEnd: false,
			leaveOnStop: false,
			selfDeaf: false,
			volume: this._config?.volume,
			timeAutoOff: this._config?.leaveOnEnd
		});
	}

	_createQueue(guild, options = {}) {
		const cache = this.player.queues.cache;
		const server = this.player.client.guilds.resolve(guild);
		if (!server)
			throw new Error("Invalid or unknown guild");
		if (cache.has(server.id))
			return cache.get(server.id);

		const queue = new Queue2(this, {
			guild: server,
			queueStrategy: options.strategy ?? "FIFO",
			volume: options.volume ?? 100,
			equalizer: options.equalizer ?? [],
			filterer: options.a_filter ?? [],
			biquad: options.biquad,
			resampler: options.resampler ?? 48e3,
			disableHistory: options.disableHistory ?? false,
			skipOnNoStream: options.skipOnNoStream ?? false,
			onBeforeCreateStream: options.onBeforeCreateStream,
			onAfterCreateStream: options.onAfterCreateStream,
			repeatMode: options.repeatMode,
			leaveOnEmpty: options.leaveOnEmpty ?? true,
			leaveOnEmptyCooldown: options.leaveOnEmptyCooldown ?? 0,
			leaveOnEnd: options.leaveOnEnd ?? true,
			leaveOnEndCooldown: options.leaveOnEndCooldown ?? 0,
			leaveOnStop: options.leaveOnStop ?? true,
			leaveOnStopCooldown: options.leaveOnStopCooldown ?? 0,
			metadata: options.metadata,
			connectionTimeout: options.connectionTimeout ?? this.player.options.connectionTimeout ?? 12e4,
			selfDeaf: options.selfDeaf ?? true,
			ffmpegFilters: options.defaultFFmpegFilters ?? [],
			bufferingTimeout: options.bufferingTimeout ?? 1e3,
			noEmitInsert: options.noEmitInsert ?? false,
			timeAutoOff: options.timeAutoOff,
		});
		cache.set(server.id, queue);
		return queue;
	}

	/**
	 * Get queue if exist
	 * 
	 * @param {import("discord.js/typings/index.js").Snowflake} guildID ID of guild
	 * @returns Queue or null
	 */
	getQueue(guildID) {
		return this.player.queues.has(guildID) ? this.player.queues.get(guildID) : null;
	}

	/**
	 * Devuelve un embed con la lista de configuraciones de
	 * equalizadores predefinidos procedentes de EqualizerConfigurationPreset
	 * 
	 * @returns Embed con la información
	 */
	embedEqualizer() {
		return {
			title: 'Lista de equalizadores',
			fields: [
				{
					name: `Configuraciones (${Object.keys(EqualizerConfigurationPreset).length})`,
					value: Object.keys(EqualizerConfigurationPreset).map((value, i) => `${i+1}. **${value}**`).join("\n")
				}
			]
		};
	}

	getEqualizerList(pos) {
		return pos===undefined ? EqualizerConfigurationPreset : EqualizerConfigurationPreset[Object.keys(EqualizerConfigurationPreset)[pos]];
	}
}


/*
import { generateDependencyReport } from "@discordjs/voice"
console.log(generateDependencyReport()); 
 */