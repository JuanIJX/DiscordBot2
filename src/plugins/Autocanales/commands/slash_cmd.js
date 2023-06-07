import { SlashCommandBuilder } from "discord.js";
import { Level } from "../../../libraries/logger.js";
import GestorCanales, { Type } from "../Canal.js";

export default {
	slash: new SlashCommandBuilder()
		.setName('canal')
		.setDescription('Comando de control de canales')
		.setDMPermission(false)

		.addSubcommand(subcommand => subcommand
			.setName('test')
			.setDescription('Comando de pruebas solo para el creador del bot')
		)

		.addSubcommand(subcommand => subcommand
			.setName('enable')
			.setDescription('Activa el Autocanales en este servidor')
		)

		.addSubcommand(subcommand => subcommand
			.setName('disable')
			.setDescription('Elimina el Autocanales de este servidor')
		)

		.addSubcommand(subcommand => subcommand
			.setName('create')
			.setDescription('Crea un canal')

			.addUserOption(option => option
				.setName('owner')
				.setDescription('Owner del canal')
			)
		)

		.addSubcommandGroup(group => group
			.setName('my')
			.setDescription('Controla tu canal')

			.addSubcommand(subcommand => subcommand
				.setName('temp')
				.setDescription('Cambia de temporal a permanente y viceversa')
			)

			.addSubcommand(subcommand => subcommand
				.setName('setowner')
				.setDescription('Cambia un canal de dueño')

				.addUserOption(option => option
					.setName('owner')
					.setDescription('Nuevo owner')
					.setRequired(true)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('inv')
				.setDescription('Cambia de visible a invisible y viceversa')
			)

			.addSubcommand(subcommand => subcommand
				.setName('lock')
				.setDescription('Abre o cierra el canal')

				.addIntegerOption(option => option
					.setName('type')
					.setDescription('Tipo de cierre del canal')
					.setRequired(true)
					.addChoices(
						{ name: 'Abierto', value: 0 },
						{ name: 'Privado', value: 1 },
						{ name: 'Solo mods', value: 2 },
						{ name: 'Full privado', value: 3 },
					)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('info')
				.setDescription('Visualiza toda la información sobre el canal')

				.addBooleanOption(option => option
					.setName('ext')
					.setDescription('Más información acerca de los roles del canal')
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('delete')
				.setDescription('Elimina el canal')
			)

			.addSubcommand(subcommand => subcommand
				.setName('mod')
				.setDescription('Gestiona los moderadores del canal')

				.addIntegerOption(option => option
					.setName('type')
					.setDescription('Tipo de acción')
					.setRequired(true)
					.addChoices(
						{ name: 'ADD', value: 0 },
						{ name: 'DEL', value: 1 },
						{ name: 'CLEAR', value: 2 },
						{ name: 'INFO', value: 3 },
					)
				)
				.addUserOption(option => option
					.setName("user")
					.setDescription("Usuario para gestionar")
				)
				.addStringOption(option => option
					.setName("ids")
					.setDescription("Conjunto de IDs para gestionar (sep: ;)")
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('member')
				.setDescription('Gestiona los miembros del canal')

				.addIntegerOption(option => option
					.setName('type')
					.setDescription('Tipo de acción')
					.setRequired(true)
					.addChoices(
						{ name: 'ADD', value: 0 },
						{ name: 'DEL', value: 1 },
						{ name: 'CLEAR', value: 2 },
						{ name: 'INFO', value: 3 },
					)
				)
				.addUserOption(option => option
					.setName("user")
					.setDescription("Usuario para gestionar")
				)
				.addStringOption(option => option
					.setName("ids")
					.setDescription("Conjunto de IDs para gestionar (sep: ;)")
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('ban')
				.setDescription('Gestiona los baneos del canal')

				.addIntegerOption(option => option
					.setName('type')
					.setDescription('Tipo de acción')
					.setRequired(true)
					.addChoices(
						{ name: 'ADD', value: 0 },
						{ name: 'DEL', value: 1 },
						{ name: 'CLEAR', value: 2 },
						{ name: 'INFO', value: 3 },
					)
				)
				.addUserOption(option => option
					.setName("user")
					.setDescription("Usuario para gestionar")
				)
				.addStringOption(option => option
					.setName("ids")
					.setDescription("Conjunto de IDs para gestionar (sep: ;)")
				)
			)
		)
	,		
	async execute(interaction) {
		const { user, member, guild, channel, options: ops } = interaction;
		const guildCanal = this.gestorCanales.get(guild.id);

		try {
			const response = await _execute.bind(this)(interaction, user, member, channel, guild, ops, guildCanal);
			if(response)
				await interaction.followUp({ content: response, ephemeral: true });
		} catch (error) {
			this.log(Level.ERROR, error);
			await interaction.followUp({ content: `Error, comando fallido`, ephemeral: true });
		}
	}
}

async function _execute(interaction, user, member, channel, guild, ops, guildCanal) {
	const cmdName = ops.getSubcommandGroup() ?? ops.getSubcommand(false);
	const hist = (function(msg) {
		this.log(Level.HIST, msg)
	}).bind(this)
	let aux_1, aux_2, aux_3;

	switch (cmdName) {
		case "test":
			await interaction.deferReply({ ephemeral: true });
			if(!this.isAdmin(user.id)) return `Acceso denegado`;
			hist("testeooo");

			return `test`;
		case "enable":
			await interaction.deferReply({ ephemeral: true });
			if (guild.ownerId != user.id && !this.isAdmin(user.id))
				return `No tienes permisos`;
			if(guildCanal != null)
				return `Ya está habilitado en este servidor`;

			await this.gestorCanales.create(guild);
			hist(`g(${guild.id}) habilitado por ${member.user.tag}(${member.id})`);
			return `Habilitado el Autocanales en este servidor`;
		case "disable":
			await interaction.deferReply({ ephemeral: true });
			if (guild.ownerId != user.id && !this.isAdmin(user.id))
				return `No tienes permisos`;
			if(guildCanal == null)
				return `El servidor no tiene habilitado Autocanal`;
			if(! await guildCanal.delete())
				return `Error al eliminar, autocanales desconectado de este servidor`;

			hist(`g(${guild.id}) deshabilitado por ${member.user.tag}(${member.id})`);
			return (guildCanal.text != channel.id && guildCanal.voice != channel.id) ? `Canales eliminados` : undefined;
		case "create":
			await interaction.deferReply({ ephemeral: true });
			if (guild.ownerId != user.id && !this.isAdmin(user.id))
				return `No tienes permisos`;
			if(guildCanal == null)
				return `El servidor no tiene habilitado Autocanal`;
			/*if(guildCanal.getCountCanales(user.id) > 0)
				return `Ya tienes un canal creado`;*/

			aux_1 = ops.getUser("owner") == null ? member : await guild.members.fetch(ops.getUser("owner")).catch(() => null);
			aux_2 = await guildCanal.createCanal(aux_1);
			await aux_2.setTemp(false);
			hist(`g(${guild.id}) c(${aux_2.id}) canal creado por ${member.user.tag}(${member.id}) para ${aux_1.user.tag}(${aux_1.id})`);
			return `Canal de ${aux_1.displayName} creado`;
		case "my":
			if(guildCanal == null)
				return `El servidor no tiene habilitado Autocanal`;
			if(!guildCanal.list.has(channel.id))
				return `No se reconoce el canal`;
			const canal = guildCanal.list.get(channel.id);

			switch (ops.getSubcommand(false)) {
				case "temp":
					await interaction.deferReply({ ephemeral: true });
					if (
						(canal.owner.id != user.id || canal.temp) &&
						guild.ownerId != user.id &&
						!this.isAdmin(user.id)
					) return `No tienes permisos`;

					await canal.setTemp(!canal.temp);
					if(canal.temp && canal.count == 0)
						return;

					hist(`g(${guild.id}) c(${canal.id}) cambiado a ${canal.temp ? `temporal` : `permanente`} por ${member.user.tag}(${member.id})`);
					return `Cambiado a ${canal.temp ? `temporal` : `permanente`}`;

				case "setowner":
					await interaction.deferReply({ ephemeral: true });
					if (
						guild.ownerId != user.id &&
						!this.isAdmin(user.id)
					) return `No tienes permisos`;

					await canal.setOwner(ops.getUser("owner"));
					hist(`g(${guild.id}) c(${canal.id}) cambiado de owner por ${member.user.tag}(${member.id}) a ${ops.getUser("owner").tag}`);
					return `Nuevo owner: ${ops.getUser("owner").tag}`;

				case "lock":
					await interaction.deferReply({ ephemeral: true });
					if (
						canal.owner.id != user.id &&
						(
							!canal.mods.has(user.id) ||
							canal.type == Type.CLOSED ||
							ops.getInteger("type") == Type.CLOSED
						) &&
						guild.ownerId != user.id &&
						!this.isAdmin(user.id)
					) return `No tienes permisos`;

					await canal.setType(ops.getInteger("type"));
					hist(`g(${guild.id}) c(${canal.id}) cambiado a tipo ${canal.type} por ${member.user.tag}(${member.id})`);
					return `Cierre: ${canal.type} ${GestorCanales._emojis[canal.type]}`;

				case "inv":
					await interaction.deferReply({ ephemeral: true });
					if (
						canal.owner.id != user.id &&
						guild.ownerId != user.id &&
						!this.isAdmin(user.id)
					) return `No tienes permisos`;

					await canal.setVisible(!canal.visible);
					hist(`g(${guild.id}) c(${canal.id}) cambiado a tipo ${canal.visible ? "visible" : "oculto"} por ${member.user.tag}(${member.id})`);
					return `Visibilidad: ${canal.visible ? "visible" : "oculto"}`;

				case "info":
					await interaction.deferReply({ ephemeral: true });
					if (
						!canal.members.has(user.id) &&
						!canal.mods.has(user.id) &&
						canal.owner.id != user.id &&
						guild.ownerId != user.id &&
						!this.isAdmin(user.id)
					) return `No tienes permisos`;

					aux_1 = [canal.embed()];
					if(
						ops.getBoolean("ext") === true &&
						(
							canal.mods.has(user.id) ||
							canal.owner.id == user.id ||
							guild.ownerId == user.id ||
							this.isAdmin(user.id)
						)
					) {
						aux_1.push(await canal.embedMods());
						aux_1.push(await canal.embedMembers());
						aux_1.push(await canal.embedBanneds());
					}
					
					await interaction.followUp(this.getEmbed(aux_1));
					return;

				case "delete":
					await interaction.deferReply({ ephemeral: true });
					if (
						canal.owner.id != user.id &&
						guild.ownerId != user.id &&
						!this.isAdmin(user.id)
					) return `No tienes permisos`;

					await canal.delete();
					hist(`g(${guild.id}) c(${canal.id}) eliminado por ${member.user.tag}(${member.id})`);
					return;

				case "mod":
					switch (ops.getInteger("type")) {
						case 0: // Add
							await interaction.deferReply({ ephemeral: true });
							aux_1 = ops.getUser("user");
							aux_2 = ops.getString("ids")?.split(";").filter(a => a!="").map(a => a.trim());
							if(!aux_2) aux_2 = [];

							// Comprobación de error, ninguna ID introducida
							if(!aux_1 && aux_2.length == 0)
								return `Se necesita un usuario o una ID`;
							
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Se filtran las IDs que sean guild.id, owner.id, incluido en mods
							// Se obtienen los objeto User mediante fetch y se filtran los inexistentes dentro del guild
							aux_2 = (
									await aux_2
										.filter(id =>
											canal.owner.id!=id &&
											canal.guild.id!=id &&
											!canal.mods.has(id)
										)
										.mapAsync(async id => await guild.members.fetch(id)
											.then(m => m.user)
											.catch(() => null)
										)
								).filter(e => e!=null);
							// Se une lo introducido por ops 'user'
							if(
								aux_1 != null &&
								canal.owner.id!=aux_1.id &&
								canal.guild.id!=aux_1.id &&
								!canal.mods.has(aux_1.id)
							) aux_2.unshift(aux_1);

							// Comprobación de error, ninguna ID váida
							if(aux_2.length == 0)
								return `Ninguna ID válida`;

							// Procesamiento si solo hay una ID
							if(aux_2.length == 1) {
								await canal.addMod(aux_2[0]);
								hist(`g(${guild.id}) c(${canal.id}) añadido [${aux_2[0].tag}] a moderador por ${member.user.tag}(${member.id})`);
								return `${aux_2[0].tag} añadido a moderador`;
							}

							// Procesamiento si hay varias IDs
							await canal.setMods(aux_2.map(e => e.id));
							hist(`g(${guild.id}) c(${canal.id}) añadidos [${aux_2.map(u => u.id).join(", ")}] a moderador por ${member.user.tag}(${member.id})`);
							return [
								`**Añadidos ${aux_2.length} moderadores**`,
								...aux_2.map(u => `🠺 ${u.tag}`)
							].join("\n");
						case 1: // Del
							await interaction.deferReply({ ephemeral: true });
							aux_1 = ops.getUser("user");
							aux_2 = ops.getString("ids")?.split(";").filter(a => a!="").map(a => a.trim());
							if(!aux_2) aux_2 = [];

							// Comprobación de error, ninguna ID introducida
							if(!aux_1 && aux_2.length == 0)
								return `Se necesita un usuario o una ID`;
							
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Se une lo introducido por ops 'user'
							if(aux_1 != null)
								aux_2.unshift(aux_1.id);

							// Recuento de IDs para eliminar
							aux_1 = [...canal.mods].filter(e => aux_2.includes(e))

							// Comprobación de error, ninguna ID
							if(aux_1.length == 0)
								return `Ninguna ID`;

							// Procesamiento si solo hay una ID
							if(aux_1.length == 1) {
								await canal.delMod(aux_1[0]);
								hist(`g(${guild.id}) c(${canal.id}) eliminado [${aux_1[0].tag}] de moderadores por ${member.user.tag}(${member.id})`);
								return await guild.members.fetch(aux_1[0])
									.then(m => `🠺 ${m.user.tag} eliminado de la lista de mods`)
									.catch(async () => await guild.client.users.fetch(aux_1[0])
										.then(u => `🗴 ${u.tag} eliminado de la lista de mods`)
										.catch(() => `Error id(${aux_1[0]})`)
									);
							}

							// Procesamiento si hay varias IDs
							await canal.setMods([...canal.mods].filter(e => !aux_2.includes(e)));
							hist(`g(${guild.id}) c(${canal.id}) eliminados [${aux_1.join(", ")}] de moderadores por ${member.user.tag}(${member.id})`);
							return [
								`**Eliminados ${aux_1.length} moderadores**`,
								...await aux_1.mapAsync(async id => await guild.members.fetch(id)
									.then(m => `🠺 ${m.user.tag} eliminado`)
									.catch(async () => await guild.client.users.fetch(id)
										.then(u => `🗴 ${u.tag} eliminado`)
										.catch(() => `Error id(${aux_1[0]})`)
									)
								)
							].join("\n");
						case 2: // Clear
							await interaction.deferReply({ ephemeral: true });
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Procesamiento
							aux_1 = [...canal.mods];
							await canal.setMods([]);
							hist(`g(${guild.id}) c(${canal.id}) moderadores vaciados por ${member.user.tag}(${member.id})`);
							return [
								`**Eliminados ${aux_1.length} moderadores**`,
								...await aux_1.mapAsync(async id => await guild.members.fetch(id)
									.then(m => `🠺 ${m.user.tag} eliminado`)
									.catch(async () => await guild.client.users.fetch(id)
										.then(u => `🗴 ${u.tag} eliminado`)
										.catch(() => `Error id(${aux_1[0]})`)
									)
								)
							].join("\n");
						case 3: // Info
							await interaction.deferReply({ ephemeral: true });
							if (
								!canal.mods.has(user.id) &&
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							await interaction.followUp(this.getEmbed(await canal.embedMods()));
							return;
					}
					return `Opción desconocida`;

				case "member":
					switch (ops.getInteger("type")) {
						case 0: // Add
							await interaction.deferReply({ ephemeral: true });
							aux_1 = ops.getUser("user");
							aux_2 = ops.getString("ids")?.split(";").filter(a => a!="").map(a => a.trim());
							if(!aux_2) aux_2 = [];

							// Comprobación de error, ninguna ID introducida
							if(!aux_1 && aux_2.length == 0)
								return `Se necesita un usuario o una ID`;

							// Se filtran las IDs que sean guild.id, owner.id, incluido en members
							// Se obtienen los objeto User mediante fetch y se filtran los inexistentes dentro del guild
							aux_2 = (
									await aux_2
										.filter(id =>
											canal.owner.id!=id &&
											canal.guild.id!=id &&
											!canal.members.has(id)
										)
										.mapAsync(async id => await guild.members.fetch(id)
											.then(m => m.user)
											.catch(() => null)
										)
								).filter(e => e!=null);
							// Se une lo introducido por ops 'user'
							if(
								aux_1 != null &&
								canal.owner.id!=aux_1.id &&
								canal.guild.id!=aux_1.id &&
								!canal.members.has(aux_1.id)
							) aux_2.unshift(aux_1);

							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								(!canal.mods.has(user.id) || aux_2.some(u => canal.mods.has(u.id))) &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Comprobación de error, ninguna ID váida
							if(aux_2.length == 0)
								return `Ninguna ID válida`;

							// Procesamiento si solo hay una ID
							if(aux_2.length == 1) {
								await canal.addMember(aux_2[0]);
								hist(`g(${guild.id}) c(${canal.id}) añadido [${aux_2[0].tag}] a miembro por ${member.user.tag}(${member.id})`);
								return `${aux_2[0].tag} añadido a miembro`;
							}

							// Procesamiento si hay varias IDs
							await canal.setMembers(aux_2.map(e => e.id));
							hist(`g(${guild.id}) c(${canal.id}) añadidos [${aux_2.map(u => u.id).join(", ")}] a miembro por ${member.user.tag}(${member.id})`);
							return [
								`**Añadidos ${aux_2.length} miembros**`,
								...aux_2.map(u => `🠺 ${u.tag}`)
							].join("\n");
						case 1: // Del
							await interaction.deferReply({ ephemeral: true });
							aux_1 = ops.getUser("user");
							aux_2 = ops.getString("ids")?.split(";").filter(a => a!="").map(a => a.trim());
							if(!aux_2) aux_2 = [];

							// Comprobación de error, ninguna ID introducida
							if(!aux_1 && aux_2.length == 0)
								return `Se necesita un usuario o una ID`;
							
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								!canal.members.has(user.id) &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Se une lo introducido por ops 'user'
							if(aux_1 != null)
								aux_2.unshift(aux_1.id);

							// Recuento de IDs para eliminar
							aux_1 = [...canal.members].filter(e => aux_2.includes(e))

							// Comprobación de error, ninguna ID
							if(aux_1.length == 0)
								return `Ninguna ID`;

							// Procesamiento si solo hay una ID
							if(aux_1.length == 1) {
								await canal.delMember(aux_1[0]);
								hist(`g(${guild.id}) c(${canal.id}) eliminado [${aux_1[0].tag}] de miembros por ${member.user.tag}(${member.id})`);
								return await guild.members.fetch(aux_1[0])
									.then(m => `🠺 ${m.user.tag} eliminado de la lista de miembros`)
									.catch(async () => await guild.client.users.fetch(aux_1[0])
										.then(u => `🗴 ${u.tag} eliminado de la lista de miembros`)
										.catch(() => `Error id(${aux_1[0]})`)
									);
							}

							// Procesamiento si hay varias IDs
							await canal.setMembers([...canal.members].filter(e => !aux_2.includes(e)));
							hist(`g(${guild.id}) c(${canal.id}) eliminados [${aux_1.join(", ")}] de moderadores por ${member.user.tag}(${member.id})`);
							return [
								`**Eliminados ${aux_1.length} miembros**`,
								...await aux_1.mapAsync(async id => await guild.members.fetch(id)
									.then(m => `🠺 ${m.user.tag} eliminado`)
									.catch(async () => await guild.client.users.fetch(id)
										.then(u => `🗴 ${u.tag} eliminado`)
										.catch(() => `Error id(${aux_1[0]})`)
									)
								)
							].join("\n");
						case 2: // Clear
							await interaction.deferReply({ ephemeral: true });
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Procesamiento
							aux_1 = [...canal.members];
							await canal.setMembers([]);
							hist(`g(${guild.id}) c(${canal.id}) miembros vaciados por ${member.user.tag}(${member.id})`);
							return [
								`**Eliminados ${aux_1.length} miembros**`,
								...await aux_1.mapAsync(async id => await guild.members.fetch(id)
									.then(m => `🠺 ${m.user.tag} eliminado`)
									.catch(async () => await guild.client.users.fetch(id)
										.then(u => `🗴 ${u.tag} eliminado`)
										.catch(() => `Error id(${aux_1[0]})`)
									)
								)
							].join("\n");
						case 3: // Info
							await interaction.deferReply({ ephemeral: true });
							if (
								!canal.members.has(user.id) &&
								!canal.mods.has(user.id) &&
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;
							
							await interaction.followUp(this.getEmbed(await canal.embedMembers()));
							return;
					}
					return `Opción desconocida`;
				
				case "ban":
					switch (ops.getInteger("type")) {
						case 0: // Add
							await interaction.deferReply({ ephemeral: true });
							aux_1 = ops.getUser("user");
							aux_2 = ops.getString("ids")?.split(";").filter(a => a!="").map(a => a.trim());
							if(!aux_2) aux_2 = [];

							// Comprobación de error, ninguna ID introducida
							if(!aux_1 && aux_2.length == 0)
								return `Se necesita un usuario o una ID`;

							// Se filtran las IDs que sean guild.id, owner.id, incluido en banneds
							// Se obtienen los objeto User mediante fetch y se filtran los inexistentes dentro del guild
							aux_2 = (
									await aux_2
										.filter(id =>
											canal.owner.id!=id &&
											canal.guild.id!=id &&
											!canal.banneds.has(id)
										)
										.mapAsync(async id => await guild.members.fetch(id)
											.then(m => m.user)
											.catch(() => null)
										)
								).filter(e => e!=null);
							// Se une lo introducido por ops 'user'
							if(
								aux_1 != null &&
								canal.owner.id!=aux_1.id &&
								canal.guild.id!=aux_1.id &&
								!canal.banneds.has(aux_1.id)
							) aux_2.unshift(aux_1);

							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								(!canal.mods.has(user.id) || aux_2.some(u => canal.mods.has(u.id))) &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Comprobación de error, ninguna ID váida
							if(aux_2.length == 0)
								return `Ninguna ID válida`;

							// Procesamiento si solo hay una ID
							if(aux_2.length == 1) {
								await canal.addBanned(aux_2[0]);
								hist(`g(${guild.id}) c(${canal.id}) usuario [${aux_2[0].tag}] baneado por ${member.user.tag}(${member.id})`);
								return `${aux_2[0].tag} baneado`;
							}

							// Procesamiento si hay varias IDs
							await canal.setBanneds(aux_2.map(e => e.id));
							hist(`g(${guild.id}) c(${canal.id}) usuarios [${aux_2.map(u => u.id).join(", ")}] baneados por ${member.user.tag}(${member.id})`);
							return [
								`**Usuarios baneados: ${aux_2.length}**`,
								...aux_2.map(u => `🠺 ${u.tag}`)
							].join("\n");
						case 1: // Del
							await interaction.deferReply({ ephemeral: true });
							aux_1 = ops.getUser("user");
							aux_2 = ops.getString("ids")?.split(";").filter(a => a!="").map(a => a.trim());
							if(!aux_2) aux_2 = [];

							// Comprobación de error, ninguna ID introducida
							if(!aux_1 && aux_2.length == 0)
								return `Se necesita un usuario o una ID`;
							
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								!canal.members.has(user.id) &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Se une lo introducido por ops 'user'
							if(aux_1 != null)
								aux_2.unshift(aux_1.id);

							// Recuento de IDs para eliminar
							aux_1 = [...canal.banneds].filter(e => aux_2.includes(e))

							// Comprobación de error, ninguna ID
							if(aux_1.length == 0)
								return `Ninguna ID`;

							// Procesamiento si solo hay una ID
							if(aux_1.length == 1) {
								await canal.delBanned(aux_1[0]);
								hist(`g(${guild.id}) c(${canal.id}) usuario [${aux_1[0].tag}] desbaneado por ${member.user.tag}(${member.id})`);
								return await guild.members.fetch(aux_1[0])
									.then(m => `🠺 ${m.user.tag} desbaneado`)
									.catch(async () => await guild.client.users.fetch(aux_1[0])
										.then(u => `🗴 ${u.tag} desbaneado`)
										.catch(() => `Error id(${aux_1[0]})`)
									);
							}

							// Procesamiento si hay varias IDs
							await canal.setBanneds([...canal.banneds].filter(e => !aux_2.includes(e)));
							hist(`g(${guild.id}) c(${canal.id}) usuarios [${aux_1.join(", ")}] desbaneados por ${member.user.tag}(${member.id})`);
							return [
								`**Usuarios desbaneados: ${aux_1.length}**`,
								...await aux_1.mapAsync(async id => await guild.members.fetch(id)
									.then(m => `🠺 ${m.user.tag} eliminado`)
									.catch(async () => await guild.client.users.fetch(id)
										.then(u => `🗴 ${u.tag} eliminado`)
										.catch(() => `Error id(${aux_1[0]})`)
									)
								)
							].join("\n");
						case 2: // Clear
							await interaction.deferReply({ ephemeral: true });
							// Comprobación de error, sin permisos
							if (
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							// Procesamiento
							aux_1 = [...canal.banneds];
							await canal.setBanneds([]);
							hist(`g(${guild.id}) c(${canal.id}) todos desbaneados por ${member.user.tag}(${member.id})`);
							return [
								`**Desbaneados: ${aux_1.length}**`,
								...await aux_1.mapAsync(async id => await guild.members.fetch(id)
									.then(m => `🠺 ${m.user.tag} eliminado`)
									.catch(async () => await guild.client.users.fetch(id)
										.then(u => `🗴 ${u.tag} eliminado`)
										.catch(() => `Error id(${aux_1[0]})`)
									)
								)
							].join("\n");
						case 3: // Info
							await interaction.deferReply({ ephemeral: true });
							if (
								!canal.mods.has(user.id) &&
								canal.owner.id != user.id &&
								guild.ownerId != user.id &&
								!this.isAdmin(user.id)
							) return `No tienes permisos`;

							await interaction.followUp(this.getEmbed(await canal.embedBanneds()));
							return;
					}
					return `Opción desconocida`;
			}
			break;
	}

	return `Fin execute`;
}