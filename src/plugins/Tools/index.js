import Module from "../../app/module.js"
import funcDelete from "./commands/delete.js"
import funcMov from "./commands/mover.js"
import { wait } from "../../libraries/utils.mjs";

export default class Tools extends Module {
	constructor() { super(...arguments); }

	onLoad() {
		this.color = 0x6600ff;
		this.registerCommand(".d", funcDelete);
		this.registerCommand(".m", funcMov);
	}
}