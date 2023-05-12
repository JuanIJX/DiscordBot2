import { Level } from "../../../libraries/logger.js";
import { decimalAdjust, isFloat, isInteger } from "../../../libraries/utils.mjs";

function embedHelp(cmdName) {
	return {
		fields: [
			{
				name: `Ayuda del bot musical **(${cmdName})**`,
				value: [
					`**${cmdName} <url>** Añade una canción a la lista y la reproduce`,
					`**${cmdName} pause** Pausa/despausa una canción`,
					`**${cmdName} skip** Pasa a la siguiente canción`,
					`**${cmdName} stop** Detiene y elimina la cola`,
					`**${cmdName} clear** Para la música y vacia la cola`,
					`**${cmdName} seek <minuto>** Pone la canción en el minuto deseado`,
					`**${cmdName} remove <index>** Elimina la canción indicada`,
					`**${cmdName} list** Muestra información del estado actual de la cola`,
					`**${cmdName} history** Muestra la lista de las canciones reproducidas`,
					`**${cmdName} info <index>** Muestra información sobre una canción`,
					`**${cmdName} help** Muestra la ayuda`,
					`**${cmdName} equalizer <[eq index]>** Muestra o pone una configuración de equalizador`,
					`**${cmdName} jump <index>** Salta a la canción indicada`,
					`**${cmdName} removepos <init> <end>** Elimina las canciones indicadas de init a end`,
				].join("\n"),
			}
		]
	};
}

export default async function(message, cmdName, args) {
	let
		channel = message.member.voice.channel,
		queue = this.musicController.getQueue(message.guildId),
		searchResult,
		cadURL,
		aux1, aux2;

	switch (args[0]) {
		case "t4":
			if(message.author.id != "171058039065935872") return;
			
			await queue.play();
			break;
		case "t3":
			if(message.author.id != "171058039065935872") return;

			console.log(message.guild.members.resolve(message.client.user));
			break;
		case "t2":
			if(message.author.id != "171058039065935872") return;
			
			channel = message.guild.channels.cache.get("901255104739541009");
			await queue.join(channel);
			break;
		case "t":
		case "test":
			if(message.author.id != "171058039065935872") return;
			try {
				cadURL = "https://open.spotify.com/playlist/4n1hWfaXaUOUihWwsgSLcP?si=3ccbecee9ea8493b";
				cadURL = "https://open.spotify.com/playlist/37i9dQZEVXcGlPKsPtaZre?si=270cc6f764864e0a&nd=1";
				cadURL = "https://www.youtube.com/watch?v=978Cb1lAY0s";
				cadURL = "https://www.youtube.com/watch?v=g7i1pkf-CbY&list=FLSXkyNPfZS2feOSwk-ZySiA&index=9&pp=gAQB&ab_channel=capoVEVO";
				cadURL = "https://open.spotify.com/playlist/37i9dQZF1E8GG77A1xDgV4";
				cadURL = "https://www.youtube.com/watch?v=p_5yt5IX38I";

				// Canciones bug
				// cadURL = "https://open.spotify.com/track/6MTd61g9zq6CB1FnJydjEb"; // esta si se reproduce aunq sea la misma q la de abajo
				//cadURL = "https://open.spotify.com/track/6yjEYK1gwGlTlD04cRm1t9";
				//cadURL = "https://www.youtube.com/watch?v=rqa1zbSqR6M";

				//channel = message.guild.channels.cache.get("970075135912591370");
				searchResult = await this.musicController.search(cadURL, { requestedBy: message.author });
				queue ??= this.musicController.createQueue(message.guildId,);
				queue.addTrack(searchResult);
				await queue.play(channel);
			} catch (error) {
				console.log(error);
			}
			console.log("hecho");
			break;
		case "pl":
		case "playlist":
			//await funcPlaylist.bind(this)(message, args.shift(), args, cmdName);
			break;
		case "seek":
			if(!queue)
				await message.reply(`No hay cola`);
			else if(!queue.isPlaying())
				await message.reply(`No hay nada en reproducción`);
			else {
				aux1 = (args.length > 1 && isFloat(args[1])) ? parseFloat(args[1])*60000 : 0;
				if(aux1 < 0 || aux1 > (queue.node.getTimestamp().total.value - 1000))
					await message.reply(`El valor no debe exceder la duración de la canción ${decimalAdjust((queue.node.getTimestamp().total.value-1000)/60000, 2, "floor")} expresado en minutos`);
				else {
					await queue.node.seek(aux1);
					aux2 = queue.node.getTimestamp().current;
					await message.reply(`Se fue a la posición de la canción ${aux2.label}`);
					this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) puso la cancion en el tiempo: ${aux2.label}`);
				}
			}
			break;
		case "p":
		case "pause":
			if(!queue)
				await message.reply(`No hay cola`);
			else if(queue.node.isPaused()) {
				queue.node.resume();
				await message.reply("Despausado");
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) despausó el bot`);
			}
			else {
				queue.node.pause();
				await message.reply("Pausado");
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) pausó el bot`);
			}
			break;
		case "help":
			await message.channel.send(this.getEmbed(embedHelp(cmdName)));
			break;
		case "eq":
		case "equalizer":
			if(args.length <= 1)
				await message.channel.send(this.getEmbed(this.musicController.embedEqualizer()));
			else if(!queue)
				await message.reply(`No hay cola`);
			else {
				aux1 = (args.length > 1 && isInteger(args[1])) ? parseInt(args[1]) : 1;
				if(aux1 < 1 || aux1 > Object.keys(this.musicController.getEqualizerList()).length)
					await message.reply(`Posición de la lista erróneo`);
				else {
					if(!queue.filters.equalizer)
						await message.reply(`El equalizador no está disponible`);
					else {
						//.setEQ([{ band: 0, gain: 0.78 }]);
						queue.filters.equalizer.setEQ(this.musicController.getEqualizerList(aux1-1))
						aux2 = Object.keys(this.musicController.getEqualizerList())[aux1-1];
						await message.reply(`Equalizer: ${aux2}`);
						this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) estableció el equalizador a ${aux2}`);
					}
				}
			}
			break;
		case "j":
		case "jump":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				aux1 = (args.length > 1 && isInteger(args[1])) ? parseInt(args[1]) : 1;
				if(aux1 < 1 || aux1 > queue.tracks.size)
					await message.reply(`Índice no válida`);
				else {
					aux2 = queue.jump(aux1-1);
					await message.reply(`Skip a ${aux1}`);
					this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) saltó a la canción '${aux2.title}'`);
				}
			}
			break;
		case "replay":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				aux1 = (args.length > 1 && isInteger(args[1])) ? parseInt(args[1]) : 1;
				if(aux1 < 1 || aux1 > queue.history.size)
					await message.reply(`Índice no válida`);
				else {
					aux2 = await queue.replay(aux1-1);
					if(!aux2)
						await message.reply(`No se pudo poner de nuevo`);
					else {
						await message.reply(`Pusiste de nuevo ${aux2.title}`);
						this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) puso de nuevo la canción '${aux2.title}'`);
					}
				}
			}
			break;
		case "removepos":
			if(!queue)
				await message.reply(`No hay cola`);
			else if(args.length < 3)
				await message.reply(`Faltan parámetros`);
			else if(!isInteger(args[1]))
				await message.reply(`El valor de inicio debe ser un entero`);
			else if(!isInteger(args[2]))
				await message.reply(`El valor de final debe ser un entero`);
			else {
				aux1 = parseInt(args[1]), aux2 = parseInt(args[2]);
				queue.removePositions(aux1 - 1, aux2 - 1);
				await message.reply(`Canciones eliminadas: ${aux2 + 1 - aux1}`);
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) eliminó ${aux2 + 1 - aux1} canciones`);
			}
			break;
		case "r":
		case "remove":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				aux1 = queue?.removeTrack((args.length > 1 && isInteger(args[1])) ? parseInt(args[1])-1 : 0);
				if(aux1) {
					await message.reply(`Canción eliminada: ${aux1.title}`);
					this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) eliminó de la lista la canción ${aux1.title}`);
				}
				else
					await message.reply(`No se eliminó nada`);
			}
			break;
		case "l":
		case "list":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				//console.log(queue.getQueueInfo());
				message.channel.send(this.getEmbed(queue.embedList((args.length > 1 && isInteger(args[1])) ? parseInt(args[1])-1 : 0, 20)));
			}
			break;
		case "h":
		case "history":
			if(!queue)
				await message.reply(`No hay cola`);
			else
				message.channel.send(this.getEmbed(queue.embedHistory((args.length > 1 && isInteger(args[1])) ? parseInt(args[1])-1 : 0, 20)));
			break;
		case "i":
		case "info":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				aux1 = (args.length > 1 && isInteger(args[1])) ? parseInt(args[1]) : 0;
				if(aux1 == 0 && !queue.currentTrack)
					await message.reply(`No hay canción reproduciendose para mostrar la información`);
				else if(aux1!=0 && (aux1 < 1 || aux1 > queue.tracks.size))
					await message.reply(`El índice debe estár entre 1 y ${queue.tracks.size}`);
				else
					message.channel.send(this.getEmbed(queue.embedInfo(aux1)));
			}
			break;
		case "stop":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				queue.delete();
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) detuvo bot de musica`);
			}
			break;
		case "clear":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				queue.clear();
				await message.reply(`Cola vaciada`);
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) reseteó la cola`);
			}
			break;
		case "s":
		case "skip":
			if(!queue)
				await message.reply(`No hay cola`);
			else {
				await queue.skip(channel);
				await message.reply(`Skipped`);
				this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) skipeó la canción`);
			}
			break;
		default:
			if(!channel)
				await message.reply(`Debes estar en un canal de voz`);
			else {
				cadURL = message.content.substr(cmdName.length).trim();
				if(!cadURL) {
					if(queue.tracks.size == 0)
						await message.reply(`No se proporcionó una canción`);
					else {
						await queue.play(channel);
						await message.reply(`Reproduciendo`);
					}
				}
				else {
					searchResult = await this.musicController.search(cadURL, { requestedBy: message.author });
					if (!searchResult || !searchResult.hasTracks())
						await message.reply(`No se encuentra la canción`);
					else {
						try {
							queue = this.musicController.createQueue(message.guildId);
							queue.addTrack(searchResult);
							if(queue.isPlaying()) {
								await message.reply(`Añadido a la cola`);
							}
							else {
								await queue.play(channel);
								await message.reply(`Reproduciendo`);
							}
							this.log(Level.HIST, `(g: ${message.guildId}) El usuario ${message.author.tag}(${message.author.id}) añadió ${searchResult.playlist ? `${searchResult.tracks.length} canciones` : `'${searchResult.tracks[0].title}'`}`);
						} catch (error) {
							await message.reply(`Error`);
							this.log(Level.ERROR, error);
						}
					}
				}
			}
			break;
	}
}

/*
- Añadir datos al objeto queue de player
- Limitar la cantidad de canciones que añadir al bot
- Hacer que funcione bien el skip
 * que arranque cuando la canción esta pausada
 * que arranque si hay canciones en cola aunque no este en play
 * que conecte al canal del solicitante si no está en ninguno
 * cada usuario solo skipeara su cancion en modo estricto, a excepción del dj y admins que skipearán todas
- limitacion del uso de la cola
 * los administradores tendrán pleno uso
 * a posteriori tendrá uso de la cola en "dj"
- quién es el dj?
 * el dj es quien crea la cola (debe estár conectado en algun canal)
 * la comprobación de quien es el dj no se hará por evento si no cuando se solicite por alguna acción
 * si el dj se desconecta pasará a ser otro usuario segun los siguientes criterios en orden de prioridad:
  · el que esté conectado en el mismo canal que el bot con la siguiente prioridad:
   > el primero que haya introducido alguna canción en el bot, se comprobará el history en orden inverso
     despues la lista de canciones en orden normal
   > si nadie de la sala introdujo nada, el dj será el primero que obtenga el bot (posible comando para darse owner)
     o el primero que le de una orden administrativa (skip, add, play, eq), no contarán ordenes informativas
	 (list, history, etc...)
  · si no hay nadie conectado donde está el bot, dj será quien lo llame desde otro canal
*/