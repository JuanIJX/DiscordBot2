import Module from "../../app/module.js"
import MusicController from "./music-controller.js";
import funcMusic from "./commands/cmdmusic.js"
export default class Music extends Module {
	async onLoad() {
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
		this.registerCommand("!pu", funcMusic);
	}
	async onEnable() {}
	async onDisable() {
		await this.mc.destroy();
	}
}