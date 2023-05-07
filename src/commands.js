import { wait } from "./libraries/utils.mjs";

export default async function(cadena, cmdName, args) {
	switch (cmdName) {
		case "test":
			console.log(this.discordManager.discord.application.commands);
			//generateDependencyReport();
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