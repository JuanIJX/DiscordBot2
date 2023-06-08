import Module from "../../app/module.js"
import funcDelete from "./commands/delete.js"
import funcDeleteId from "./commands/deleteId.js"
import funcMov from "./commands/mover.js"

export default class Tools extends Module {
	constructor() { super(...arguments); }
	onLoad() {
		this.color = 0x6600ff;
		this.registerCommand(".m", funcMov);
		this.registerCommand(".d", funcDelete);
		this.registerCommand(".di", funcDeleteId);
	}
}