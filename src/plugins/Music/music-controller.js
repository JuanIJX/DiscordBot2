import { Level } from "../../libraries/logger.js";
import { Player, EqualizerConfigurationPreset } from "./DiscordPlayer.cjs"
import PlaylistManager from "./myplaylist.js";
import Queue from "./queue.js";
export default class MusicController {
	constructor(module) {
		Object.defineProperty(this, "module", { value: module, enumerable: true });
		Object.defineProperty(this, "player", { value: new Player(this.module.discordManager.discord, {
			autoRegisterExtractor: false,
			ytdlOptions: { quality: "highestaudio", highWaterMark: 1 << 25 }
		}), enumerable: true });
		Object.defineProperty(this, "_config", { value: this.module.configManager.get("queue").content });
	}

	async load() {
		await this.player.extractors.loadDefault();

		PlaylistManager.player = this.player;
		PlaylistManager.pluginPath = this.module.thisPath;

		this.player.events.on('playerStart', (queue, track) => this.module.log(Level.DEBUG, `(g: ${queue.id}) Canción iniciada '${track.title}'`));
		this.player.events.on('playerFinish', (queue, track) => this.module.log(Level.DEBUG, `(g: ${queue.id}) Canción finalizada '${track.title}'`));
		if(this._config?.debug?.player === true)
			this.player.on('debug', msg => console.log(msg));
		if(this._config?.debug?.queue === true)
			this.player.events.on('debug', (queue, msg) => console.log(msg));
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
	createQueue(guildID) {
		return new Queue(this.player.queues.create(guildID, {
			leaveOnEmpty: false,
			leaveOnEnd: false,
			leaveOnStop: false,
			selfDeaf: false,
			volume: this._config?.volume ?? 100,
		}), this);
	}

	/**
	 * Get queue if exist
	 * 
	 * @param {import("discord.js/typings/index.js").Snowflake} guildID ID of guild
	 * @returns Queue or null
	 */
	getQueue(guildID) {
		return this.player.queues.has(guildID) ? new Queue(this.player.queues.get(guildID)) : null;
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