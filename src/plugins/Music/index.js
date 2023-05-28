import Module from "../../app/module.js"
import MusicController from "./music-controller.js";
import funcMusic from "./commands/cmd_music.js"
import slashMusicPlaylist from "./commands/slash_musicplaylist.js"
export default class Music extends Module {
	async onLoad() {
		this.color = 0xbb00ff;
		this.configManager.add("queue", "config/queue.yml", {
			leaveOnEnd: 600,
			volume: 100,
			debug: {
				player: false,
				queue: false
			}
		});
		this.musicController = new MusicController(this);
		await this.musicController.load();

		this.registerCommand("!Po", funcMusic);
		this.registerCommand("!po", funcMusic);

		await this.registerSlash(slashMusicPlaylist);
	}
	async onEnable() {}
	async onDisable() {
		await this.musicController.destroy();
	}
}