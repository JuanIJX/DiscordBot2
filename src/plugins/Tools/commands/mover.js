import { ChannelType, PermissionFlagsBits } from "discord.js";
import { Level } from "../../../libraries/logger.js";
import { getEmbed } from "../../../app/ownfunctions.js";

async function mover(channel_origen, channel_destino) {
	let movidos = 0;
	for (const [key, client] of channel_origen.members) {
		await client.voice.setChannel(channel_destino);
		movidos++;
	}
	return movidos;
}

function getEmbedHelp(client) {
	return getEmbed({
		color: 0x6600ff,
		author: {
			name: client.user.tag,
			icon_url: client.user.displayAvatarURL(),
		},
		fields: [
			{
				name: 'Ayuda del comando mover **(.m)**',
				value: '**.m <destino>** Mueve desde donde estés a destino\n**.m <destino> <origen>** Mueve de origen a destino\n**.m h <origen>** Mueve a origen a donde estés',
			}
		],
		timestamp: new Date().toISOString(),
		footer: {
			text: "© IJX",
			icon_url: client.user.displayAvatarURL(),
		},
	});
}

/**
 * .m destino <origen: donde yo esté> // Nos vamos
 * .m destino origen
 * .m h origen // Vienen
 */
export default async function (message, cmdName, args) {
	let delay = 4000;

	if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
		message.tempReply("No tienes permiso para usar el comando", delay);
		return;
	}

	switch (args[0]) {
		case null:
		case undefined:
		case "":
			message.member.send(getEmbedHelp(message.client));
			break;
		case "puthelp":
			if(!message.member.permissions.has(PermissionFlagsBits.MoveMembers))
				message.tempReply("No tienes permiso para usar el comando", delay);
			else {
				await message.channel.send(getEmbedHelp(message.client));
				message.delete();
			}
			break;
		case "h":
		case "here":
			if(args.length <= 1)
				message.tempReply("Debes estar en un canal de voz", delay);
			else {
				let channel_destino = message.member.voice.channel;
				if(channel_destino === null) {
					message.tempReply("Debes estar en un canal de voz", delay);
					return;
				}

				let channel_origen = await message.guild.fetchChannelOrNull(args[1]);
				if(channel_origen === null)
					message.tempReply("Canal introducido inválido", delay);
				else if (channel_origen.type != ChannelType.GuildVoice)
					message.tempReply("El canal introducido debe ser de voz", delay);
				else if (channel_origen.id == channel_destino.id)
					message.tempReply("El canal de origen no puede ser el mismo que el destino", delay);
				else {
					let moved = await mover(channel_origen, channel_destino);
					message.tempReply(`Movidos: ${moved}`, delay);
					this.log(Level.HIST, `El usuario ${message.author.tag}(${message.author.id}) movió a ${moved} usuarios del canal ${channel_origen.name}(${channel_origen.id}) al canal ${channel_destino.name}(${channel_destino.id})`);
				}
			}
			break;
		default:
			if(args.length <= 1) {
				let channel_origen = message.member.voice.channel;
				if(channel_origen === null) {
					message.tempReply("Debes estar en un canal de voz", delay);
					return;
				}
				
				let channel_destino = await message.guild.fetchChannelOrNull(args[0]);
				if(channel_destino === null)
					message.tempReply("Canal introducido inválido", delay);
				else if (channel_destino.type != ChannelType.GuildVoice)
					message.tempReply("El canal introducido debe ser de voz", delay);
				else if (channel_origen.id == channel_destino.id)
					message.tempReply("El canal de origen no puede ser el mismo que el destino", delay);
				else {
					let moved = await mover(channel_origen, channel_destino);
					message.tempReply(`Movidos: ${moved}`, delay);
					this.log(Level.HIST, `El usuario ${message.author.tag}(${message.author.id}) movió a ${moved} usuarios del canal ${channel_origen.name}(${channel_origen.id}) al canal ${channel_destino.name}(${channel_destino.id})`);
				}
			}
			else {
				let channel_destino = await message.guild.fetchChannelOrNull(args[0]);
				let channel_origen = await message.guild.fetchChannelOrNull(args[1]);
				try {
					if(channel_origen.id == channel_destino.id)
						message.tempReply("El canal de origen no puede ser el mismo que el destino", delay);
					else {
						let moved = await mover(channel_origen, channel_destino);
						message.tempReply(`Movidos: ${moved}`, delay);
						this.log(Level.HIST, `El usuario ${message.author.tag}(${message.author.id}) movió a ${moved} usuarios del canal ${channel_origen.name}(${channel_origen.id}) al canal ${channel_destino.name}(${channel_destino.id})`);
					}
				} catch (error) {
					message.tempReply(error.message, delay);
				}
			}
			break;
	}
};