import { isInteger, wait } from "./libraries/utils.mjs";
import { Level } from "./libraries/logger.js";
import { CRol, RolPerms, Type } from "./plugins/Autocanales/Canal.js";

//function log(level, msg) { this._logger.log(level, this.name, msg); }

export default async function(cadena, cmdName, args) {
	let user, member, guild;
	let aux_1, aux_2, aux_3;

	switch (cmdName) {
		case "t":
		case "test":
			aux_1 = this.modules.get("Autocanales").gestorCanales;
			aux_2 = aux_1.list.get("772607985104060417"); // guildCanal
			member = await aux_2.guild.members.fetch("171058039065935872").then(member => member);
			user = member.user;

			//await aux_2.createCanal(user);
			aux_3 = aux_2.list.get("1114027592056582195"); // Canal
			await aux_3.addBanned("754407873567654048");

			console.log(aux_3.toJSON());

			
			//aux_3.channel.permissionOverwrites.edit(userID, perms);
			break;
		case "pl":
		case "plugins":
			aux_1 = 0;
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