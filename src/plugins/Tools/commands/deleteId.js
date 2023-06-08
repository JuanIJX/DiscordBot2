import { Collection, PermissionFlagsBits } from "discord.js";
import { isInteger } from "../../../libraries/utils.mjs";
import { Level } from "../../../libraries/logger.js";

async function lastMessage(channel) {
	return (await channel.messages.fetch({ limit: 1, cache: false })).first();
}

export default async function(message, cmdName, args) {
	let delay = 4000;
	if(args.length <= 0)
		await message.tempReply(`Faltan parámetros, ejemplo: ${cmdName} <id del mensaje>`, delay);
	else if(message.guild.ownerId != message.member.id && !this.isAdmin(message.member.id))
		await message.tempReply(`No tienes permisos para ejecutar este comando`, delay);
	else {
		const initMsg = await message.channel.messages.fetch(args[0]).catch(async () => { await message.tempReply(`Mensaje ID no encontrada`, 4000); return null; });
		if(!initMsg) return;

		let lastID = null, cn = 0;
		do {
			lastID = await (await lastMessage(initMsg.channel)).delete()
				.then(msg => {
					this.log(Level.DEBUG, `Mensaje id(${msg.id}) content(${msg.content}) embed=${msg.embeds.length > 0 ? "TRUE" : "FALSE"} eliminado`);
					cn++;
					return msg.id;
				})
				.catch(async err => { await message.tempReply(`Error: ${err.message}`, 4000); return null; });

		} while (lastID != null && lastID != initMsg.id);
		if(!lastID) return;
		this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) eliminó ${cn} mensajes del canal ${message.channel.name}(${message.channel.id})`);
	}
}