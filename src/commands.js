import { EOL } from "os";
import { isInteger, wait } from "./libraries/utils.mjs";
import { Level } from "./libraries/logger.js";
import { PermissionFlagsBits } from "discord.js";

export default async function(cadena, cmdName, args) {
	const log = (function(msg, level) { this._logger.log(level ?? Level.INFO, "CONSOLE", msg); }).bind(this);
	let cn = 0, user, member, guild;
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
		case "g":
		case "guilds":
			aux_1 = await this.discordManager.discord.guilds.fetch();
			log([
				`Lista de servidores (${aux_1.size}):`,
				...aux_1.map(g => `- ID(${g.id}) '${g.name}'`)
			].join(EOL));
			break;
		case "gl":
		case "guildleave":
			if(args.length == 0)
				log(`Falta el número de plugin`, Level.ERROR);
			else {
				guild = await this.discordManager.discord.guilds.fetch(args[0]).catch(() => { log(`Guild ID(${args[0]}) no encontrado`, Level.ERROR); return null; });
				if(guild)
					await guild.leave();
			}
			break;
		case "gi":
		case "guildinfo":
			if(args.length == 0)
				log(`Falta el número de plugin`, Level.ERROR);
			else {
				guild = await this.discordManager.discord.guilds.fetch(args[0]).catch(() => { log(`Guild ID(${args[0]}) no encontrado`, Level.ERROR); return null; });
				if(guild) {
					aux_1 = await guild.roles.fetch();
					aux_2 = guild.voiceStates.cache;
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
							.map(rol => `  🞄 ${rol.name}: ${rol.permissions.has(PermissionFlagsBits.Administrator) ? 'ADMIN' : 'NORMAL'}`),
						`- Voice states: ${aux_2.size}`,
						...aux_2 // Comprobar tmb si es un bot
							.map(vs => `  🞄 ID(${vs.id}) '${vs.member.displayName}'${vs.member.user.bot ? " BOT" : ""} |${
									(vs.suppress ? '🚫' : '') +
									(vs.serverDeaf ? '🔇' : '') +
									(vs.serverMute ? '🚷' : '') +
									(vs.selfDeaf ? '🙉' : '') +
									(vs.selfMute ? '😬' : '') +
									(vs.selfVideo ? '📸' : '') +
									(vs.streaming ? '📺' : '')
								} => '${(await guild.channels.fetch(vs.channelId)).name}'`)
					].join(EOL));
				}
			}
			break;
		case "help":
			log([
				`Lista de comandos de consola:`,
				`- plugins`,
				`- enablepl`,
				`- disablepl`,
				`- enlace`,
				`- guilds`,
				`- guildleave`,
				`- guildinfo`
			].join(EOL));
			break;
		default:
			log(`Comando desconocido '${cmdName}'`, Level.ERROR);
			break;
	}
};
