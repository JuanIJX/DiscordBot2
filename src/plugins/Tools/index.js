import Module from "../../app/module.js"
export default class Tools extends Module {
	constructor(...params) {
		super(...arguments);

		this.addConfig("c1", "config/file.yml", {
			arr: false,
			version: 4
		});

		//console.log(this.configs.get("c1").content);
	}

	onEnable() {
		console.log("Se arranco el plugin");
	}

	onDisable() {

	}
}