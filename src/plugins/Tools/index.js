import Module from "../../app/module.js"
export default class Tools extends Module {
	constructor(...params) {
		super(...arguments);

		this.addConfig("c1", "config/file.yaml", {
			arr: false,
			version: 4
		});

		console.log(this.configs.get("c1").content);
	}
}