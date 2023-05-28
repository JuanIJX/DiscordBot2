import { Events } from "discord.js";
import { isInteger, wait } from "./libraries/utils.mjs";
import { Level } from "./libraries/logger.js";

//function log(level, msg) { this._logger.log(level, this.name, msg); }

export default async function(cadena, cmdName, args) {
	var aux_1;
	switch (cmdName) {
		case "t":
		case "test":
			console.log(Object.values(Events));
			break;
		case "pl":
		case "plugins":
			var aux_1 = 0;
			console.log(`Lista de plugins:`);
			this.modules.forEach((value, key) => console.log(`- ${++aux_1} ${key}: ${value.started ? "ON" : "OFF"}`));
			break;
		case "ep":
		case "enablepl":
			if(args.length == 0)
				console.log(`Falta el número de plugin`);
			else if(!isInteger(args[0]))
				console.log(`El parámetro debe ser un número`);
			else if(parseInt(args[0]) < 1 || parseInt(args[0]) > this.modules.size)
				console.log(`El número debe estár comprendido entre 1 y ${this.modules.size}`);
			else {
				aux_1 = this.modules.at(parseInt(args[0])-1);
				if(aux_1.started)
					console.log(`El plugin ya se encuentra activado`);
				else
					await aux_1.start();
			}
			break;
		case "dp":
		case "disablepl":
			if(args.length == 0)
				console.log(`Falta el número de plugin`);
			else if(!isInteger(args[0]))
				console.log(`El parámetro debe ser un número`);
			else if(parseInt(args[0]) < 1 || parseInt(args[0]) > this.modules.size)
				console.log(`El número debe estár comprendido entre 1 y ${this.modules.size}`);
			else {
				aux_1 = this.modules.at(parseInt(args[0])-1);
				if(!aux_1.started)
					console.log(`El plugin ya se encuentra detenido`);
				else
					await aux_1.stop();
			}
			break;
		default:
			console.log(`Comando desconocido '${cmdName}'`);
			break;
	}
};