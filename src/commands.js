import { wait } from "./libraries/utils.mjs";

export default async (main, cadena, cmdName, args) => {
	switch (cmdName) {
		case "pl":
			console.log(`Lista de plugins:`);
			main.modules.forEach((value, key) => {
				console.log(`- ${key}`);
			});
			break;
		default:
			console.log(`Comando desconocido '${cmdName}'`);
			break;
	}
};