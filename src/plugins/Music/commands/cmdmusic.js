import { Level } from "../../../libraries/logger.js";
import { isInteger } from "../../../libraries/utils.mjs";
export default async function(message, cmdName, args) {
	let
		channel = message.member.voice.channel,
		queue = this.mc.getQueue(message.guildId),
		searchResult,
		cadURL,
		aux1, aux2;

	switch (args[0]) {
		case "t":
		case "test":
			if(message.author.id != "171058039065935872")
				return;
			cadURL = "https://open.spotify.com/playlist/4n1hWfaXaUOUihWwsgSLcP?si=3ccbecee9ea8493b";
			cadURL = "https://open.spotify.com/playlist/37i9dQZEVXcGlPKsPtaZre?si=270cc6f764864e0a&nd=1";
			//cadURL = "https://www.youtube.com/watch?v=978Cb1lAY0s";
			//channel = message.guild.channels.cache.get("1090594158294601810");
			searchResult = await this.mc.search(cadURL);
			queue = this.mc.createQueue(message.guildId);
			await queue.addAndPlay(searchResult, channel);
			break;
		case "eq":
		case "equalizer":
			if(args.length <= 1)
				message.channel.send(this.getEmbed(this.mc.embedEqualizer()));
			else if(!queue)
				message.reply(`No hay cola`);
			else {
				aux1 = (args.length > 1 && isInteger(args[1])) ? parseInt(args[1]) : 1;
				if(aux1 < 1 || aux1 > Object.keys(this.mc.getEqualizerList()).length)
					message.reply(`Posición de la lista erróneo`);
				else {
					if(!queue.queue.filters.equalizer)
						message.reply(`El equalizador no está disponible`);
					else {
						//.setEQ([{ band: 0, gain: 0.78 }]);
						queue.queue.filters.equalizer.setEQ(this.mc.getEqualizerList(aux1-1))
						message.reply(`Equalizer: ${Object.keys(this.mc.getEqualizerList()[aux1-1])}`);
						this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) estableció el equalizador a ${Object.keys(this.mc.getEqualizerList()[aux1-1])}`);
					}
				}
			}
			break;
		case "j":
		case "jump":
			if(!queue)
				message.reply(`No hay cola`);
			else {
				aux1 = (args.length > 1 && isInteger(args[1])) ? parseInt(args[1]) : 1;
				if(aux1 < 1 || aux1 > queue.tracksLength())
					message.reply(`Posición no válida`);
				else {
					aux2 = queue.jump(aux1-1);
					message.reply(`Skip a ${aux1}`);
					this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) saltó a la canción '${aux2.title}'`);
				}
			}
			break;
		case "removepos":
			if(!queue)
				message.reply(`No hay cola`);
			else if(args.length < 3)
				message.reply(`Faltan parámetros`);
			else {
				try {
					queue.removePositions(parseInt(args[1])-1, parseInt(args[2])-1);
					message.reply(`Canciones eliminadas: ${parseInt(args[2]) + 1 - parseInt(args[1])}`);
					this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) eliminó ${parseInt(args[2]) + 1 - parseInt(args[1])} canciones`);
				} catch (error) {
					message.reply(error.message);
				}
			}
			break;
		case "r":
		case "remove":
			aux1 = queue?.removeTrack((args.length > 1 && isInteger(args[1])) ? parseInt(args[1])-1 : 0);
			if(aux1) {
				message.reply(`Canción eliminada: ${aux1.title}`);
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) eliminó de la lista la canción ${aux1.title}`);
			}
			else
				message.reply(`No se eliminó nada`);
			break;
		case "l":
		case "list":
			if(!queue)
				message.reply(`No hay cola`);
			else
				message.channel.send(this.getEmbed(queue.embedList((args.length > 1 && isInteger(args[1])) ? parseInt(args[1])-1 : 0, 10)));
			break;
		case "stop":
			if(!queue)
				message.reply(`No hay cola`);
			else {
				queue.queue.delete();
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) detuvo bot de musica`);
			}
			break;
		case "s":
		case "skip":
			if(!queue)
				message.reply(`No hay cola`);
			else {
				queue.skip();
				message.reply(`Skipped`);
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) skipeó la canción`);
			}
			break;
		default:
			if(!channel)
				message.reply(`Debes estar en un canal de voz`);
			else {
				cadURL = message.content.substr(cmdName.length).trim();
				if(!cadURL)
					message.reply(`No se proporcionó una canción`);
				else {
					searchResult = await this.mc.search(cadURL, { requestedBy: message.member });
					if (!searchResult || !searchResult.hasTracks())
						message.reply(`No se encuentra la canción`);
					else {
						try {
							queue = this.mc.createQueue(message.guildId);
							if(await queue.addAndPlay(searchResult, channel))
								message.reply(`Reproduciendo`);
							else
								message.reply(`Añadido a la cola`);
							this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) añadió ${searchResult.playlist ? `${searchResult.tracks.length} canciones` : `'${searchResult.tracks[0].title}'`}`);
						} catch (error) {
							message.reply(`Error`);
							this.log(Level.DEBUG, error);
						}
					}
				}
			}
			break;
	}
}