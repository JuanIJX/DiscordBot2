import { PermissionFlagsBits } from "discord.js";
import { isInteger } from "../../../libraries/utils.mjs";
import { Level } from "../../../libraries/logger.js";

export default async function(message, cmdName, args) {
	let delay = 4000;
	if(args.length <= 0)
		await message.tempReply(`Faltan parámetros, ejemplo: ${cmdName} <numero de lineas>`, delay);
	else if(!isInteger(args[0]) || parseInt(args[0]) <= 0)
		await message.tempReply(`El parámetro debe ser un número entero`, delay);
	else if(!message.member.permissions.has(PermissionFlagsBits.Administrator))
		await message.tempReply(`No tienes permisos para ejecutar este comando`, delay);
	else
		await message.channel.bulkDelete(parseInt(args[0])+1)
			.then(messages => this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) eliminó ${messages.size} mensajes del canal ${message.channel.name}(${message.channel.id})`))
			.catch(async error => await message.tempReply(error.message, delay)
		);
}