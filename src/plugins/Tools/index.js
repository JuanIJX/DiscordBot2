import Module from "../../app/module.js"
import funcDelete from "./commands/delete.js"
import funcMov from "./commands/mover.js"
import { wait } from "../../libraries/utils.mjs";

export default class Tools extends Module {
	constructor() { super(...arguments); }

	onLoad() {
		this.color = 0x6600ff;
		//this.configs.get("c1").content
		this.configManager.add("c1", "config/file.yml", {
			arr: false,
			masPruebas: "jiji",
			version: 4
		});

		this.registerCommand(".d", funcDelete);
		this.registerCommand(".m", funcMov);
	}
}