import { wait } from "./libraries/utils.mjs";

export default async function(cadena, cmdName, args) {
	switch (cmdName) {
		case "t":
		case "test":
			var musicModule = this.modules.get("Music");
			console.log(musicModule.thisPath)

			//console.log(musicModule.musicController.player.scanDeps());
			break;
		case "pl":
			console.log(`Lista de plugins:`);
			this.modules.forEach((value, key) => {
				console.log(`- ${key}: ${value.started ? "ON" : "OFF"}`);
			});
			break;
		default:
			console.log(`Comando desconocido '${cmdName}'`);
			break;
	}
};