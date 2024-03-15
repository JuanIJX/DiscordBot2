import { EOL } from "os";
import { isInteger, wait } from "./libraries/utils.mjs";
import { Level } from "./libraries/logger.js";
import { PermissionFlagsBits } from "discord.js";

export default async function(cadena, cmdName, args) {
	const log = (function(msg, level) { this._logger.log(level ?? Level.INFO, "CONSOLE", msg); }).bind(this);
	let cn = 0, user, member, guild, channel;
	let aux_1, aux_2, aux_3;

	switch (cmdName) {
		case "t":
		case "test":
			/*aux_1 = this.modules.get("Autocanales").gestorCanales;
			aux_2 = aux_1.list.get("772607985104060417"); // guildCanal
			member = await aux_2.guild.members.fetch("171058039065935872").then(member => member);
			user = member.user;

			//await aux_2.createCanal(user);
			aux_3 = aux_2.list.get("1114027592056582195"); // Canal
			await aux_3.addBanned("754407873567654048");

			console.log(aux_3.toJSON());*/

			log(`test`);
			break;
		case "ch":
		case "channels":
			aux_1 = await this.discordManager.discord.channels.cache;
			log(`Lista de canales en cache (${aux_1.size})`)
			if(args[0])
				log([
					...aux_1.map(channel => `channel(${channel.id}) '${channel.name}'\tguild(${channel.guild.id}) '${channel.guild.name}'`),
					`Size: (${aux_1.size})`,
				]);
			break;
		case "us":
		case "users":
			aux_1 = await this.discordManager.discord.users.cache;
			log(`Lista de usuarios en cache (${aux_1.size})`)
			if(args[0])
				log([
					...aux_1.map(user => `user(${user.id}) '${user.username}'`),
					`Size: (${aux_1.size})`,
				]);
			break;
		case "qs":
		case "queues":
			aux_1 = this.modules.get("Music").musicController.player.nodes.cache;
			log(`Queues (${aux_1.size}):`)
			aux_1.forEach(guildQueue => {
				const { id, name, guild } = guildQueue.dispatcher.channel;
				log(`guild(${guild.id})='${guild.name}' channel(${id})='${name}'`);
			});
			break;
		case "pl":
		case "plugins":
			log([
				`Lista de plugins (${this.modules.size}):`,
				...this.modules.map((value, key) => `- ${++cn} ${key}: ${value.started ? "ON" : "OFF"}`)
			].join(EOL));
			break;
		case "ep":
		case "enablepl":
			if(args.length == 0)
				log(`Falta el número de plugin`, Level.ERROR);
			else if(!isInteger(args[0]))
				log(`El parámetro debe ser un número`, Level.ERROR);
			else if(parseInt(args[0]) < 1 || parseInt(args[0]) > this.modules.size)
				log(`El número debe estár comprendido entre 1 y ${this.modules.size}`, Level.ERROR);
			else {
				aux_1 = this.modules.at(parseInt(args[0])-1);
				if(aux_1.started)
					log(`El plugin ya se encuentra activado`, Level.ERROR);
				else
					await aux_1.start();
			}
			break;
		case "dp":
		case "disablepl":
			if(args.length == 0)
				log(`Falta el número de plugin`, Level.ERROR);
			else if(!isInteger(args[0]))
				log(`El parámetro debe ser un número`, Level.ERROR);
			else if(parseInt(args[0]) < 1 || parseInt(args[0]) > this.modules.size)
				log(`El número debe estár comprendido entre 1 y ${this.modules.size}`, Level.ERROR);
			else {
				aux_1 = this.modules.at(parseInt(args[0])-1);
				if(!aux_1.started)
					log(`El plugin ya se encuentra detenido`, Level.ERROR);
				else
					await aux_1.stop();
			}
			break;
		case "enlace":
			log(this.inviteLink);
			break;
		case "kick":
			if(args.length < 2)
				log(`Faltan parámetros: kick <guild> <user>`, Level.ERROR);
			else {
				guild = await this.discordManager.discord.guilds.fetch(args[0]).catch(() => { log(`Guild ID(${args[0]}) no encontrado`, Level.ERROR); return null; });
				if(guild) {
					member = await guild.members.fetch(args[1]).catch(() => { log(`Member ID(${args[1]}) no encontrado`, Level.ERROR); return null; });
					if(member)
						await member.kick()
							.then(member => log(`Usuario '${member.displayName}' expulsado del servidor '${guild.name}'`))
							.catch(err => log(`Log error al expulsar al usuario '${member.displayName}'`));
				}
			}
			break;
		case "g":
		case "guilds":
			aux_1 = await this.discordManager.discord.guilds.fetch();
			aux_2 = [];
			for (const [guildId] of aux_1) {
				const g = await this.discordManager.discord.guilds.fetch(guildId);
				aux_2.push(`- ID(${g.id}) '${g.name}' (${g.voiceStates.cache.filter(vs => !!vs.channelId).size}/${g.memberCount})`)
			}
			log([ `Lista de servidores (${aux_1.size}):`, ...aux_2 ].join(EOL));
			break;
		case "gl":
		case "guildleave":
			if(args.length == 0)
				log(`Falta el número de guild`, Level.ERROR);
			else {
				guild = await this.discordManager.discord.guilds.fetch(args[0]).catch(() => { log(`Guild ID(${args[0]}) no encontrado`, Level.ERROR); return null; });
				if(guild)
					await guild.leave();
			}
			break;
		case "gi":
		case "guildinfo":
			if(args.length == 0)
				log(`Falta el número de guild`, Level.ERROR);
			else {
				guild = await this.discordManager.discord.guilds.fetch(args[0]).catch(() => { log(`Guild ID(${args[0]}) no encontrado`, Level.ERROR); return null; });
				if(guild) {
					aux_1 = await guild.roles.fetch();
					aux_2 = guild.voiceStates.cache.filter(vs => !!vs.channelId)
					aux_3 = {};
					for (const [_, vs] of aux_2) {
						if(!vs.channelId)
							continue;
						channel = await guild.channels.fetch(vs.channelId);
						if(!aux_3.hasOwnProperty(channel.id))
							aux_3[channel.id] = { channel, vs: [] };
						aux_3[channel.id].vs.push(vs);
					}

					log([
						`Información del guild ID(${guild.id}) '${guild.name}'`,
						`- Owner: ID(${guild.ownerId}) '${await guild.members.fetch(guild.ownerId).then(m => m.displayName)}'`,
						`- Fecha creacion: ${guild.createdAt.format("d/m/Y H:i:s")}`,
						`- Fecha de entrada: ${guild.joinedAt.format("d/m/Y H:i:s")}`,
						`- Description: ${guild.description}`,
						`- Miembros: ${guild.memberCount}`,
						`- MFA Level: ${[ 'NONE', 'ELEVATED' ][guild.mfaLevel]}`,
						`- Verification Level: ${[ 'NONE', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH' ][guild.verificationLevel]}`,
						`- NSFW Level: ${[ 'DEFAULT', 'EXPLICIT', 'SAFE', 'AGE_RESTRICTED' ][guild.nsfwLevel]}`,
						`- Premium Tier: ${[ 'NONE', 'TIER_1', 'TIER_2', 'TIER_3' ][guild.premiumTier]}`,
						`- Verificado: ${guild.verified ? 'SI' : 'NO'}`,
						`- Partnered: ${guild.partnered ? 'SI' : 'NO'}`,
						`- Roles: ${aux_1.size}`,
						...aux_1
							.sort((rA, rB) => rB.position - rA.position)
							.map(rol => `  🞄 rol(${rol.id}) '${rol.name}': ${rol.permissions.has(PermissionFlagsBits.Administrator) ? 'ADMIN' : 'NORMAL'}`),
						`- Voice states: ${aux_2.size}`,
						...aux_3.map((channelID, channelVs) => [
								`  🞄 '${channelVs.channel.name}' => '${channelVs.channel.guild.name}' channel(${channelID}) guild(${channelVs.channel.guild.id}) (${channelVs.vs.length})`,
								...channelVs.vs.map(vs => `    ~ user(${vs.id}) '${vs.member.displayName}'${vs.member.user.bot ? " BOT" : ""}${vs.member.permissions.has(PermissionFlagsBits.Administrator) ? " ADM" : ""} | ${
									(vs.suppress ? '🚫' : '') +
									(vs.serverDeaf ? '🔇' : '') +
									(vs.serverMute ? '🚷' : '') +
									(vs.selfDeaf ? '🙉' : '') +
									(vs.selfMute ? '😬' : '') +
									(vs.selfVideo ? '📸' : '') +
									(vs.streaming ? '📺' : '')
								}`),
							].join("\n"))
					].join(EOL));
				}
			}
			break;
		case "help":
			log([
				`Lista de comandos de consola:`,
				`- plugins, pl`,
				`- enablepl, ep`,
				`- disablepl, dp`,
				`- enlace`,
				`- queues, qs`,
				`- channels, ch`,
				`- users, us`,
				`- guilds, g`,
				`- guildleave, gl`,
				`- guildinfo, gi`
			].join(EOL));
			break;
		default:
			log(`Comando desconocido '${cmdName}'`, Level.ERROR);
			break;
	}
};
