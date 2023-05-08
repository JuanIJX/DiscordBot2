import { isInteger } from "../../../libraries/utils.mjs";
import PlaylistManager from "../myplaylist.js";

export default async function(message, cmdName, args, mainCmdname) {
	let
		userPlayList = PlaylistManager.get(message.author),
		myPlaylist,
		aux1,
		aux2;

	switch (args[0]) {
		case "l":
		case "list":
			if(!userPlayList || userPlayList.size == 0)
				await message.reply("No hay listas de reproducción");
			else
				await message.reply(this.getEmbed(userPlayList.embed()));
			break;
		case "c":
		case "create":
			if(args.length <= 1)
				await message.reply("Falta el nombre de la playlist");
			else {
				aux1 = message.content.substr(message.content.indexOf(args[0]) + args[0].length).trim();
				if(aux1.length > 100)
					await message.reply("No puede exceder los 100 caracteres");
				else {
					userPlayList ??= PlaylistManager.create(message.author);
					userPlayList.create(aux1);
					userPlayList.save();
					await message.reply(`Creada la lista con el nombre: '${aux1}'`);
					// Log aki
				}
			}
			break;
		case "r":
		case "remove":
			if(!userPlayList || userPlayList.size == 0)
				await message.reply("No hay listas de reproducción");
			else if(args.length <= 1 || !isInteger(args[1]))
				await message.reply("Falta el número de la lista");
			else {
				aux1 = parseInt(args[1]);
				if(aux1 < 1 || aux1 > userPlayList.size)
					await message.reply(`El índice debe estár entre 1 y ${userPlayList.size}`);
				else {
					
				}
			}
			break;
		case "help":
			await message.reply("Ayuda en construcción...");
			console.log(mainCmdname);
			console.log(args);
			break;
		case undefined:
		case null:
		case "":
			break;
		default:
			await message.reply("En construcción...");
			break;
	}
}