import { PermissionFlagsBits } from "discord.js";
import { isInteger } from "../../../libraries/utils.mjs";

export default async function(message, cmdName, args) {
	let delay = 4000;
	if(args.length <= 0)
		message.tempReply(`Faltan parámetros, ejemplo: ${cmdName} <numero de lineas>`, delay);
	else if(!isInteger(args[0]) || parseInt(args[0]) <= 0)
		message.tempReply(`El parámetro debe ser un número entero`, delay);
	else if(!message.member.permissions.has(PermissionFlagsBits.Administrator))
		message.tempReply(`No tienes permisos para ejecutar este comando`, delay);
	else
		await message.channel.bulkDelete(parseInt(args[0])+1);
}