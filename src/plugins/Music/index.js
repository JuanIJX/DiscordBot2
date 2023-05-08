import Module from "../../app/module.js"
import MusicController from "./music-controller.js";
import funcMusic from "./commands/cmd_music.js"
import slashMusicPlaylist from "./commands/slash_musicplaylist.js"
import { ChannelType, SlashCommandBuilder } from "discord.js";
export default class Music extends Module {
	async onLoad() {
		this.color = 0xbb00ff;
		this.configManager.add("queue", "config/queue.yml", {
			selfDeaf: false,
			leaveOnEmpty: false,
			leaveOnEnd: false,
			leaveOnEmptyCooldown: 30000,
			leaveOnEndCooldown: 30000,
			leaveOnStop: false,
        	leaveOnStopCooldown: 30000,
			volume: 100,
		});
		this.mc = new MusicController(this, this.configManager.get("queue"));
		await this.mc.load();

		this.registerCommand("!Pu", funcMusic);
		this.registerCommand("!pu", funcMusic);

		await this.registerSlash(slashMusicPlaylist);
	}
	async onEnable() {}
	async onDisable() {
		await this.mc.destroy();
	}
}