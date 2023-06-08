import path from "path"
import fsPromise from "fs/promises"
import { BaseChannel, ChannelType, Collection, GuildMember, PermissionFlagsBits, User } from "discord.js"
import { createDirs } from "../../libraries/utils.mjs";
import Sqlite from "../../libraries/SQL_sqlite3.js";
import { Level } from "../../libraries/logger.js";

export const Type = {
	PUBLIC: 0,
	PRIVATE: 1,
	SECRET: 2,
	CLOSED: 3,
};

export const CRol = {
	OWNER: 0,
	MOD: 1,
	MEMBER: 2,
	BANNED: 3,
	NONE: 4,
}

export const RolPerms = [
	{	// 0 - PUBLIC
		OWNER: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: true,
			ModerateMembers: true,
			ManageMessages: true,
			ManageChannels: true,
		},
		MOD: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: null,
			ModerateMembers: true,
			ManageMessages: null,
			ManageChannels: null,
		},
		MEMBER: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		BANNED: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		NONE: {
			ViewChannel: null,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		}
	},
	{	// 1 - PRIVATE
		OWNER: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: true,
			ModerateMembers: true,
			ManageMessages: true,
			ManageChannels: true,
		},
		MOD: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: null,
			ModerateMembers: true,
			ManageMessages: null,
			ManageChannels: null,
		},
		MEMBER: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		BANNED: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		NONE: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		}
	},
	{	// 2 - SECRET
		OWNER: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: true,
			ModerateMembers: true,
			ManageMessages: true,
			ManageChannels: true,
		},
		MOD: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: null,
			ModerateMembers: true,
			ManageMessages: null,
			ManageChannels: null,
		},
		MEMBER: {
			ViewChannel: null,

			ReadMessageHistory: null,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		BANNED: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		NONE: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		}
	},
	{	// 3 - CLOSED
		OWNER: {
			ViewChannel: true,

			ReadMessageHistory: true,
			Connect: true,
			SendMessages: true,
			Speak: true,

			MoveMembers: true,
			ModerateMembers: true,
			ManageMessages: true,
			ManageChannels: true,
		},
		MOD: {
			ViewChannel: null,

			ReadMessageHistory: null,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		MEMBER: {
			ViewChannel: null,

			ReadMessageHistory: null,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		BANNED: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: false,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		},
		NONE: {
			ViewChannel: null,

			ReadMessageHistory: false,
			Connect: false,
			SendMessages: false,
			Speak: null,

			MoveMembers: null,
			ModerateMembers: null,
			ManageMessages: null,
			ManageChannels: null,
		}
	}
];

export default class GestorCanales {
	static _defaultNameCategory = "< ( * -=- * ) > AutoCanales < ( * -=- * ) >";
	static _defaultNameText = "📝comandos";
	static _defaultNameVoice = "➕ Crear canal";
	static _srcFile = "data";
	static _fileName = id => `guild_${id}.sqlite`;
	static _tableName_config = "config";
	static _tableName_channels = "channels";
	static _table_config = `CREATE TABLE IF NOT EXISTS ${this._tableName_config} (
		guild VARCHAR(20) NOT NULL PRIMARY KEY,
		channel_category VARCHAR(20) DEFAULT NULL,
		channel_text VARCHAR(20) DEFAULT NULL,
		channel_voice VARCHAR(20) DEFAULT NULL,
		default_temp INTEGER NOT NULL CHECK (default_temp IN (0, 1)),
		default_channelname VARCHAR(100) NOT NULL,
		default_type INTEGER NOT NULL CHECK (default_type IN (0, 1, 2, 3)),
		default_antiadmin INTEGER NOT NULL CHECK (default_antiadmin IN (0, 1)),
		default_antibots INTEGER NOT NULL CHECK (default_antibots IN (0, 1)),
		default_visible INTEGER NOT NULL CHECK (default_visible IN (0, 1)),
		default_onlycam INTEGER NOT NULL CHECK (default_onlycam IN (0, 1))
	);`;
	static _table_channels = `CREATE TABLE IF NOT EXISTS ${this._tableName_channels} (
		guild VARCHAR(20) NOT NULL,
		channel VARCHAR(20) NOT NULL PRIMARY KEY,
		created DATETIME NOT NULL DEFAULT (datetime('now', 'localtime')),
		temp INTEGER NOT NULL CHECK (temp IN (0, 1)),
		name VARCHAR(100) NOT NULL,
		owner VARCHAR(20) NOT NULL,
		type INTEGER NOT NULL CHECK (type IN (0, 1, 2, 3)),
		mods TEXT NOT NULL DEFAULT '',
		members TEXT NOT NULL DEFAULT '',
		banneds TEXT NOT NULL DEFAULT '',
		antiadmin INTEGER NOT NULL CHECK (antiadmin IN (0, 1)),
		antibots INTEGER NOT NULL CHECK (antibots IN (0, 1)),
		visible INTEGER NOT NULL CHECK (visible IN (0, 1)),
		onlycam INTEGER NOT NULL CHECK (onlycam IN (0, 1)),
		FOREIGN KEY (guild) REFERENCES ${this._tableName_config}(guild)
	);`;
	static _emojis = [ '🔓', '🔏', '🔐', '🔑', '🙉', '🙈' ];
	static _permsAllowDeny = (type, cRol, visible=true) => {
		const perms = RolPerms[type][CRol.getKeyByValue(cRol)];
		const ret = { allow: [], deny: [] }
		for (const key in perms) {
			if(perms[key] === null) continue;
			ret[perms[key] === true ? 'allow' : 'deny'].push(PermissionFlagsBits[key]);
		}
		if(visible===false)
			if(
				(type == Type.PUBLIC && cRol == CRol.BANNED) ||
				(type > Type.PUBLIC && cRol == CRol.NONE)
			) ret.deny.push(PermissionFlagsBits.ViewChannel);
		return ret;
	};
	static _getEmbedHelp = cmdname => {
		return {
			title: `Información sobre el grupo de canales`,
			description: `Para crear un canal simplemente entra a la sala de auto-crear y automáticamente tendrás tu canal temporal 🕯.`,
			fields: [
				{
					name: `${cmdname} my lock <0, 1, 2, 3>`,
					value: `Abre o cierra el canal
						🔓 (0): Todos menos baneados
						🔏 (1): Solo miembros, mods y creador
						🔐 (2): Mods y creador
						🔑 (3): Solo creador`
				},
				{
					name: `${cmdname} my mod`,
					value: `Añade o elimina un/os moderador/es al grupo de canales`
				},
				{
					name: `${cmdname} my member`,
					value: `Añade o elimina un/os miembro/s al grupo de canales`
				},
				{
					name: `${cmdname} my ban`,
					value: `Banea o desbanea a un usuario del grupo de canales`
				},
				{
					name: `${cmdname} my kick`,
					value: `Expulsa a usuario/s de la sala`
				},
				{
					name: `${cmdname} my name`,
					value: `Cambia el nombre del canal (en construccion)`
				},
				{
					name: `${cmdname} my temp`,
					value: `Cambia el canal a temporal o permanente`
				},
				{
					name: `${cmdname} my antiadmin`,
					value: `Activa/desactiva el antiadmin del canal`
				},
				{
					name: `${cmdname} my antibots`,
					value: `Permite la entrada de bots sin añadir`
				},
				{
					name: `${cmdname} my inv`,
					value: `Pone invisible o visible el canal
					🙉 Invisibilidad desactivada
					🙈 Invisibilidad activada`
				}
			]
		};
	}
	static _getEmbedInfoChannel = canal => {
		return {
			title: `${canal.name}`,
			fields: [
				{
					name: `Creación`,
					value: canal.created.format("d/m/Y\nH:i:s"),
					inline: true
				},
				{
					name: `Dueño/a`,
					value: canal.owner.displayName,
					inline: true
				},
				{
					name: `Usuarios`,
					value: [
						`Mods: ${canal.mods.size}`,
						`Miembros: ${canal.members.size}`,
						`Baneos: ${canal.banneds.size}`,
					].join("\n"),
					inline: true
				},
				//{ name: '\u200b', value: '\u200b', inline: true },
				{ name: 'Tipo', value: `[${canal.type}] ${this._emojis[canal.type]}`, inline: true },
				{ name: 'Temporal', value: canal.temp ? '🕥' : '🤚', inline: true },
				{ name: 'Visible', value: canal.visible ? '👀' : '🟠', inline: true },
				{ name: 'Onlycam', value: canal.onlycam ? '📸' : '🟠', inline: true },
				{ name: 'Anti-admin', value: canal.antiadmin ? '🟢' : '🟠', inline: true },
				{ name: 'Anti-bots', value: canal.antibots ? '🟢' : '🟠', inline: true },
			]
		};
	}
	static _getEmbedInfoChannelMods = async canal => {
		const list = await [...canal.mods].mapAsync(async id =>
			await canal.guild.members.fetch(id)
				.then(m => `🠺 ${m.user.tag}`)
				.catch(async () => await canal.guild.client.users.fetch(id)
						.then(u => `🗴 ${u.tag}`)
						.catch(() => `Err (${id})`)
				)
		);
		return {
			title: `${canal.name}`,
			description: `**Moderadores (${list.length})**\n` + (list.length > 0 ? list.join("\n") : `Vacío`)
		};
	}
	static _getEmbedInfoChannelMembers = async canal => {
		const list = await [...canal.members].mapAsync(async id =>
			await canal.guild.members.fetch(id)
				.then(m => `🠺 ${m.user.tag}`)
				.catch(async () => await canal.guild.client.users.fetch(id)
						.then(u => `🗴 ${u.tag}`)
						.catch(() => `Err (${id})`)
				)
		);
		return {
			title: `${canal.name}`,
			description: `**Miembros (${list.length})**\n` + (list.length > 0 ? list.join("\n") : `Vacío`)
		};
	}
	static _getEmbedInfoChannelBanneds = async canal => {
		const list = await [...canal.banneds].mapAsync(async id =>
			await canal.guild.members.fetch(id)
				.then(m => `🠺 ${m.user.tag}`)
				.catch(async () => await canal.guild.client.users.fetch(id)
						.then(u => `🗴 ${u.tag}`)
						.catch(() => `Err (${id})`)
				)
		);
		return {
			title: `${canal.name}`,
			description: `**Baneados (${list.length})**\n` + (list.length > 0 ? list.join("\n") : `Vacío`)
		};
	}
	


	/**
	 * 
	 * @param {Module} plugin 
	 */
	constructor(plugin) {
		Object.defineProperty(this, "_plugin", { value: plugin });
		Object.defineProperty(this, "_list", { value: new Collection() });
	}

	get _pluginPath() { return this._plugin.thisPath; }
	get discordManager() { return this._plugin.discordManager; }

	get list() { return this._list; }

	//
	debug(msg) { this._plugin.log(Level.DEBUG, msg); }
	error(msg) { this._plugin.log(Level.ERROR, msg); }
	hist(msg) { this._plugin.log(Level.HIST, msg); }

	/**
	 * Carga de los gestores de cada servidor
	 */
	async load() {
		const init_path = path.join(this._pluginPath, this.constructor._srcFile);
		createDirs(init_path);
		const rutas = (await fsPromise.readdir(init_path)).filter(e => e.getExt() == "sqlite");
		for (const file of rutas) {
			try {
				if((await fsPromise.stat(path.join(init_path, file))).isFile()) {
					const guildId = file.delExt().substring(6);
					if(guildId == "")
						continue;
					const guild = this.discordManager.discord.guilds.resolve(guildId);
					if(guild == null)
						continue;
					this._list.set(guildId, await new GuildCanal(this, guild).load());
					this.debug(`Guild(${guildId}) cargado`);
				}
			} catch (error) {
				this.error(error);
			}
		}
		return this;
	}

	/**
	 * Desconecta las conexiones a la BD de cada guild
	 */
	async unLoad() {
		for (const [_, guildCanal] of this.list)
			await guildCanal.close();
	}

	/**
	 * Obtiene la ruta donde debería encontrarse almacenado
	 * el fichero con los datos un guild
	 * 
	 * @param {string} id ID de discord del guild
	 * @returns Devuelve la ruta
	 */
	getFilePath(id) {
		return path.join(this._pluginPath, this.constructor._srcFile, this.constructor._fileName(id));
	}

	/**
	 * Devuelve un objeto de tipo GuildCanal asociado, si no
	 * existe se crea con su fichero correspondiente
	 * 
	 * @param {GuildResolvable} Guild Usuario de discord
	 * @returns objeto de tipo Promise<GuildCanal>
	 */
	async create(guildResolvable, options={}) {
		const guild = this.discordManager.discord.guilds.resolve(guildResolvable);
		if(guild == null)
			throw new Error("El parámetro debe ser un GuildResolvable");
		if(this._list.has(guild.id))
			throw new Error("Ya existe un Autocanales en este servidor");

		const category = await guild.channels.create({
			name: options.category ?? this.constructor._defaultNameCategory,
			type: ChannelType.GuildCategory,
			permissionOverwrites: [
				{
					id: guild.id,
					allow: [PermissionFlagsBits.ReadMessageHistory],
					deny: [PermissionFlagsBits.SendMessages],
				}
			],
		});
		this.debug(`Guild(${guild.id}) categoria creada id(${category.id})`);

		const text = await guild.channels.create({
			name: options.text ?? this.constructor._defaultNameText,
			type: ChannelType.GuildText,
			parent: category
		}).then(c => c.lockPermissions());
		this.debug(`Guild(${guild.id}) canal de texto creado id(${text.id})`);

		const voice = await guild.channels.create({
			name: options.voice ?? this.constructor._defaultNameVoice,
			type: ChannelType.GuildVoice,
			parent: category
		}).then(c => c.lockPermissions());
		this.debug(`Guild(${guild.id}) canal de texto creado id(${voice.id})`);

		const msg = await text.send(this._plugin.getEmbed(this.constructor._getEmbedHelp("/canal")));
		for (let em of this.constructor._emojis)
			await msg.react(em);
		this.debug(`Guild(${guild.id}) reacciones añadidas al canal (${text.id})`);
		
		const guildCanal = await new GuildCanal(this, guild, {
			category,
			text,
			voice,
		}).initLoad();
		this._list.set(guild.id, guildCanal);
		return guildCanal;
	}

	/**
	 * Devuelve un objeto de tipo GuildCanal en caso de
	 * existir, si no devuelve null
	 * 
	 * @param {string} guildID 
	 * @returns objeto de tipo GuildCanal o null
	 */
	get(guildID) {
		return this._list.has(guildID) ? this._list.get(guildID) : null;
	}

	/**
	 * 
	 */
	async delete(guildID) {
		if(!this._list.has(guildID))
			return;
		await this._list.get(guildID).delete();
	}

	/**
	 * Elimina el fichero de la base de datos
	 * 
	 * @param {string} id ID del guild que se desea eliminar
	 */
	async deleteFile(id) {
		return await fsPromise.unlink(this.getFilePath(id))
			.then(() => {
				this.debug(`Fichero ${this.constructor._fileName(id)} eliminado`);
				return true;
			})
			.catch(error => {
				this.error(error);
				return false;
			});
	}


	// Get events
	voiceStateUpdate(oldState, newState) {
		if(oldState.channel === null)
			this._joinEvent(newState.channel, newState.member);
		else if(newState.channel === null)
			this._leaveEvent(oldState.channel, oldState.member);
		else if(oldState.channel != newState.channel) {
			this._leaveEvent(oldState.channel, oldState.member);
			this._joinEvent(newState.channel, newState.member);
		}
	}
	messageReactionAdd(messageReaction, user) {
		this._messageReactionAdd(messageReaction, user);
	}
	channelDelete(channel) {
		this._channelDelete(channel);
	}
	channelUpdate(channelOld, channelNew) {
		if(channelOld.name != channelNew.name)
			this._channelChangeName(channelNew);
	}
	guildMemberRemove(member) {
		_guildMemberRemove(member);
	}
	guildDelete(guild) {
		_guildDelete(guild);
	}


	// Private events
	async _joinEvent(channel, member) {
		if(this.list.has(channel.guild.id)) {
			const guildCanal = this.list.get(channel.guild.id);
			if(guildCanal.voice.id === channel.id) {
				try {
					let canal = guildCanal.list.find(c => c.owner.id == member.user.id);
					if(!canal) {
						canal = await guildCanal.createCanal(member);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) canal creado por ${member.user.tag}(${member.id}) para si mismo`);
					}
					try {
						await member.voice.setChannel(canal?.channel);
					} catch (error) {
						await member.voice.setChannel(null);
					}
				} catch (error) { this.error(error); }
			}
		}
	}

	async _leaveEvent(channel) {
		if(this.list.has(channel.guild.id)) {
			const guildCanal = this.list.get(channel.guild.id);
			if(guildCanal.list.has(channel.id))
				await guildCanal.list.get(channel.id).shouldbeDeleted();
		}
	}

	async _messageReactionAdd(reaction, user) {
		if(this.list.has(reaction.message.channel.guild.id)) {
			const guildCanal = this.list.get(reaction.message.channel.guild.id);
			if(guildCanal.text.id === reaction.message.channel.id) {
				await reaction.users.remove(user.id);
				const canal = guildCanal.list.find(canal => canal.owner.id == user.id);
				if(!canal) return;

				switch (this.constructor._emojis.getKeyByValue(reaction.emoji.name)) {
					case "0": // Lock 1
						await canal.setType(Type.PUBLIC);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) cambiado a tipo ${canal.type} por ${user.tag}(${user.id})`);
						break;
					case "1": // Lock 2
						await canal.setType(Type.PRIVATE);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) cambiado a tipo ${canal.type} por ${user.tag}(${user.id})`);
						break;
					case "2": // Lock 3
						await canal.setType(Type.SECRET);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) cambiado a tipo ${canal.type} por ${user.tag}(${user.id})`);
						break;
					case "3": // Lock 4
						await canal.setType(Type.CLOSED);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) cambiado a tipo ${canal.type} por ${user.tag}(${user.id})`);
						break;
					case "4": // Visible
						await canal.setVisible(true);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) cambiado a visible por ${user.tag}(${user.id})`);
						break;
					case "5": // Invisible
						await canal.setVisible(false);
						this.hist(`g(${guildCanal.id}) c(${canal.id}) cambiado a invisible por ${user.tag}(${user.id})`);
						break;
				}
			}
		}
	}

	async _channelDelete(channel) {
		if(this.list.has(channel.guild.id)) {
			const guildCanal = this.list.get(channel.guild.id);
			if(guildCanal.category.id == channel.id)
				await guildCanal.setCategory(null);
			else if(guildCanal.text.id == channel.id)
				await guildCanal.setText(null);
			else if(guildCanal.voice.id == channel.id)
				await guildCanal.setVoice(null);
			else if(guildCanal.list.has(channel.id))
				await guildCanal.list.get(channel.id).delete(false);
		}
	}

	async _channelChangeName(channel) {
		if(this.list.has(channel.guild.id)) {
			const guildCanal = this.list.get(channel.guild.id);
			if(guildCanal.list.has(channel.id))
				await guildCanal.list.get(channel.id).setName(channel.name, false);
		}
	}

	async guildMemberRemove(member) {
		if(this.list.has(member.guild.id))
			await this.list
				.get(member.guild.id).list
				.filter(canal => canal.owner.id == member.id)
				.forEachAsync(async canal => await canal.delete());
	}

	async guildDelete(guild) {
		if(this.list.has(guild.id))
			await this.list.get(guild.id).delete(false);
	}

	async _guildMemberRemove(member) {
		if(this.list.has(member.guild.id))
			await this.list.get(member.guild.id).list
				.filter(canal => canal.owner.id == member.id)
				.forEachAsync(async canal => canal.delete());
	}

	async _guildDelete(guild) {
		if(this.list.has(guild.id))
			await this.list.get(guild.id).delete(false);
	}
}

class GuildCanal {
	constructor(manager, guild, channels) {
		Object.defineProperty(this, "_manager", { value: manager });
		Object.defineProperty(this, "_file", { value: this._manager.getFilePath(guild.id) });
		Object.defineProperty(this, "_idbd", { value: new Sqlite(this._file) });
		Object.defineProperty(this, "_list", { value: new Collection() });

		// Database
		Object.defineProperty(this, "_guild", { value: guild, writable: true });
		Object.defineProperty(this, "_channel_category", { value: channels?.category ?? null, writable: true });
		Object.defineProperty(this, "_channel_text", { value: channels?.text ?? null, writable: true });
		Object.defineProperty(this, "_channel_voice", { value: channels?.voice ?? null, writable: true });
		Object.defineProperty(this, "_default_temp", { value: true, writable: true });
		Object.defineProperty(this, "_default_channelname", { value: '🐇 $USER', writable: true });
		Object.defineProperty(this, "_default_type", { value: 0, writable: true });
		Object.defineProperty(this, "_default_antiadmin", { value: false, writable: true });
		Object.defineProperty(this, "_default_antibots", { value: false, writable: true });
		Object.defineProperty(this, "_default_visible", { value: true, writable: true });
		Object.defineProperty(this, "_default_onlycam", { value: false, writable: true });
	}

	debug(msg) { this._manager._plugin.log(Level.DEBUG, msg); }
	error(msg) { this._manager._plugin.log(Level.ERROR, msg); }

	// Carga de datos
	async load() {
		await this._idbd.connect([`PRAGMA foreign_keys = ON;`]);

		const data = await this._idbd.row(`SELECT * FROM ${GestorCanales._tableName_config} WHERE guild = ?`, this.id);
		this._guild = this._manager.discordManager.discord.guilds.resolve(data.guild);

		this._channel_category = this._manager.discordManager.discord.channels.resolve(data.channel_category);
		this._channel_text = this._manager.discordManager.discord.channels.resolve(data.channel_text);
		this._channel_voice = this._manager.discordManager.discord.channels.resolve(data.channel_voice);
		this._default_temp = data.default_temp == 1 ? true : false;
		this._default_channelname = data.default_channelname;
		this._default_type = parseInt(data.default_type);
		this._default_antiadmin = data.default_antiadmin == 1 ? true : false;
		this._default_antibots = data.default_antibots == 1 ? true : false;
		this._default_visible = data.default_visible == 1 ? true : false;
		this._default_onlycam = data.default_onlycam == 1 ? true : false;

		for (const canalObj of await this._idbd.rows(`SELECT * FROM ${GestorCanales._tableName_channels} WHERE guild = ?`, this.id)) {
			const channel = await this._guild.channels.fetch(canalObj.channel).then(channel => channel).catch(() => null)
			if(channel == null) {
				await this._idbd.execute(`DELETE FROM ${GestorCanales._tableName_channels} WHERE channel = ?;`, canalObj.channel);
				continue;
			}
			const owner = await this._guild.members.fetch(canalObj.owner).catch(() => null)
			if(owner == null) {
				const canalesDB = await this._idbd.rows(`SELECT * FROM ${GestorCanales._tableName_channels} WHERE owner = ?;`, canalObj.owner);
				await this._idbd.execute(`DELETE FROM ${GestorCanales._tableName_channels} WHERE owner = ?;`, canalObj.owner);
				this.debug(`Eliminados los canales [${canalesDB.map(cb => cb.channel).join(", ")}] de la BD del owner(${canalObj.owner} por inexistente)`);
				continue;
			}

			const canal = new Canal(this, channel, {
				created: new Date(canalObj.created),
				temp: canalObj.temp == 1 ? true : false,
				name: canalObj.name,
				owner,
				type: parseInt(canalObj.type),
				mods: canalObj.mods.split(";").filter2(id => id!=""),
				members: canalObj.members.split(";").filter2(id => id!=""),
				banneds: canalObj.banneds.split(";").filter2(id => id!=""),
				antiadmin: canalObj.antiadmin == 1 ? true : false,
				antibots: canalObj.antibots == 1 ? true : false,
				visible: canalObj.visible == 1 ? true : false,
				onlycam: canalObj.onlycam == 1 ? true : false,
			});
			canal.reloadPerms();
			this._list.set(channel.id, canal);
			this.debug(`Guild(${this.id}) canal(${canal.id}) cargado`);
			await canal.shouldbeDeleted();
		}
		return this;
	}
	async initLoad() {
		await this._idbd.connect([`PRAGMA foreign_keys = ON;`]);
		await this._idbd.execute(GestorCanales._table_config);
		await this._idbd.execute(GestorCanales._table_channels);
		await this._idbd.execute(`INSERT INTO ${GestorCanales._tableName_config} (
			guild,
			channel_category,
			channel_text,
			channel_voice,
			default_temp,
			default_channelname,
			default_type,
			default_antiadmin,
			default_antibots,
			default_visible,
			default_onlycam
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [
			this._guild.id,
			this._channel_category?.id ?? null,
			this._channel_text?.id ?? null,
			this._channel_voice?.id ?? null,
			this._default_temp ? 1 : 0,
			this._default_channelname,
			this._default_type,
			this._default_antiadmin ? 1 : 0,
			this._default_antibots ? 1 : 0,
			this._default_visible ? 1 : 0,
			this._default_onlycam ? 1 : 0,
		]);
		this.debug(`Guild(${this.id}) BD creada`);
		return this;
	}

	// Getters
	get list() { return this._list; }
	get id() { return this._guild.id; }
	get guild() { return this._guild; }
	get category() { return this._channel_category; }
	get text() { return this._channel_text; }
	get voice() { return this._channel_voice; }
	get defaultTemp() { return this._default_temp; }
	get defaultChannelname() { return this._default_channelname; }
	get defaultType() { return this._default_type; }
	get defaultAntiadmin() { return this._default_antiadmin; }
	get defaultAntibots() { return this._default_antibots; }
	get defaultVisible() { return this._default_visible; }
	get defaultOnlycam() { return this._default_onlycam; }

	// Setters
	async setCategory(data) {
		if(data!=null) {
			data = this.guild.channels.fetch(data?.id).then(c => c).catch(() => null);
			if(data == null)
				throw new Error("Se debe proporcionar un Channel o Null");
			if(data.type != ChannelType.GuildCategory)
				throw new Error("Se debe proporcionar un canal de tipo Category");
		}
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET channel_category = ? WHERE guild = ?`, data?.id ?? null, this.id);
		this._channel_category = data;
	}
	async setText(data) {
		if(data!=null) {
			data = this.guild.channels.fetch(data?.id).then(c => c).catch(() => null);
			if(data == null)
				throw new Error("Se debe proporcionar un Channel o Null");
			if(data.type != ChannelType.GuildText)
				throw new Error("Se debe proporcionar un canal de tipo Text");
		}
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET channel_text = ? WHERE guild = ?`, data?.id ?? null, this.id);
		this._channel_text = data;
	}
	async setVoice(data) {
		if(data!=null) {
			data = this.guild.channels.fetch(data?.id).then(c => c).catch(() => null);
			if(data == null)
				throw new Error("Se debe proporcionar un Channel o Null");
			if(data.type != ChannelType.GuildVoice)
				throw new Error("Se debe proporcionar un canal de tipo Voice");
		}
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET channel_voice = ? WHERE guild = ?`, data?.id ?? null, this.id);
		this._channel_voice = data;
	}
	async setDefaultTemp(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_temp = ? WHERE guild = ?`, data ? 1 : 0, this.id);
		this._default_temp = data;
	}
	async setDefaultChannelname(data) {
		if(typeof data != "string")
			throw new Error(`Se debe proporcionar una cadena`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_channelname = ? WHERE guild = ?`, data, this.id);
		this._default_channelname = data;
	}
	async setDefaultType(data) {
		if(!Object.values(Type).includes(data))
			throw new Error(`El valor debe ser alguno de estos: [${Object.values(Type)}]`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_type = ? WHERE guild = ?`, data, this.id);
		this._default_type = data;
	}
	async setDefaultAntiadmin(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_antiadmin = ? WHERE guild = ?`, data ? 1 : 0, this.id);
		this._default_antiadmin = data;
	}
	async setDefaultAntibots(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_antibots = ? WHERE guild = ?`, data ? 1 : 0, this.id);
		this._default_antibots = data;
	}
	async setDefaultVisible(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_visible = ? WHERE guild = ?`, data ? 1 : 0, this.id);
		this._default_visible = data;
	}
	async setDefaultOnlycam(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_config} SET default_onlycam = ? WHERE guild = ?`, data ? 1 : 0, this.id);
		this._default_onlycam = data;
	}

	/**
	 * Devuelve el número de canales que posee un User
	 * 
	 * @param {string} ownerID ID del User
	 * @returns Cantidad de canales que posee
	 */
	getCountCanales(ownerID) {
		return this.list.reduce((ac, canal) => ac += canal.owner.id == ownerID ? 1 : 0, 0);
	}

	/**
	 * Elimina toda la configuración del Autocanales en el guild
	 * 
	 * @returns true en caso de que sea correcta la eliminación
	 */
	async delete(guildExists = true) {
		const channels = this.list.map(canal => canal.channel);
		if(! await this.disconnect()) return false;
		this.debug(`Eliminado el guild(${this.id})`);

		if(guildExists) {
			for (const channel of channels)
				await channel.delete();
			if(this.category != null && await this.guild.channels.fetch(this.category.id).then(() => true).catch(() => false)) {
				await this.guild.channels.delete(this.category);
				this.debug(`Guild(${this.guild.id}) canal de texto eliminado id(${this.category.id})`);
			} else
				this.error(`No se pudo eliminar guild(${this.guild.id}) id(${this.category.id})`);

			if(this.text != null && await this.guild.channels.fetch(this.text.id).then(() => true).catch(() => false)) {
				await this.guild.channels.delete(this.text);
				this.debug(`Guild(${this.guild.id}) canal de texto eliminado id(${this.text.id})`);
			} else
				this.error(`No se pudo eliminar guild(${this.guild.id}) id(${this.text.id})`);

			if(this.voice != null && await this.guild.channels.fetch(this.voice.id).then(() => true).catch(() => false)) {
				await this.guild.channels.delete(this.voice);
				this.debug(`Guild(${this.guild.id}) canal de texto eliminado id(${this.voice.id})`);
			} else
				this.error(`No se pudo eliminar guild(${this.guild.id}) id(${this.voice.id})`);
		}
		return true;
	}

	/**
	 * Desconecta de la base de datos, elimina el fichero
	 * y elimina del listado del guilds
	 * 
	 * @returns true en caso de que sea correcto
	 */
	async disconnect() {
		if(! await this.close())
			return false;
		this._manager.list.delete(this.id);
		if(! await this._manager.deleteFile(this.id))
			return false;
		return true;
	}

	/**
	 * Crea un canal
	 * 
	 * @param {GuildMember} owner 
	 * @returns 
	 */
	async createCanal(owner) {
		if(!(owner instanceof GuildMember))
			throw new Error("Se debe proporcionar un GuildMember");
		if(await this.guild.members.fetch(owner.id).then(() => false).catch(() => true))
			throw new Error("El miembro no se encuentra en el servidor");
		if(!this._idbd.isConnected())
			throw new Error("La base de datos no está conectada");

		const channelName = this.defaultChannelname.replace(`$USER`, owner.displayName)
		const channel = await this.guild.channels.create({
			name: channelName,
			type: ChannelType.GuildVoice,
			permissionOverwrites: [
				{ id: this.guild.id, ...GestorCanales._permsAllowDeny(this.defaultType, CRol.NONE, this.defaultVisible) },
				{ id: owner.id, 	 ...GestorCanales._permsAllowDeny(this.defaultType, CRol.OWNER) }
			],
			parent: this.category
		});
		//this._default_temp = false; // TEMP
		await this._idbd.execute(`INSERT INTO ${GestorCanales._tableName_channels} (
			guild,
			channel,
			temp,
			name,
			owner,
			type,
			antiadmin,
			antibots,
			visible,
			onlycam
		) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [
			this.id,
			channel.id,
			this.defaultTemp,
			channelName,
			owner.id,
			this.defaultType,
			this.defaultAntiadmin,
			this.defaultAntibots,
			this.defaultVisible,
			this.defaultOnlycam,
		]);

		const canal = new Canal(this, channel, {
			created: new Date(),
			temp: this.defaultTemp,
			name: channelName,
			owner,
			type: this.defaultType,
			mods: [], members: [], banneds: [],
			antiadmin: this.defaultAntiadmin,
			antibots: this.defaultAntibots,
			visible: this.defaultVisible,
			onlycam: this.defaultOnlycam,
		});
		await canal.reloadPerms(this.defaultType);
		this._list.set(channel.id, canal);
		this.debug(`Canal(${canal.id}) del guild(${this.id}) creado`);
		return canal;
	}

	// Cerrar conexion a la base de datos
	async close() {
		return await this._idbd.close()
			.then(() => {
				this.debug(`BD desconectada g(${this.id}) f(${path.basename(this._idbd._memoryPath)})`);
				return true;
			})
			.catch(error => {
				this.error(error);
				return false;
			});
	}
}

class Canal {
	constructor(parent, channel, data) {
		if(!(channel instanceof BaseChannel) || !channel.isVoiceBased())
			throw new Error("Se debe especificar un canal de tipo voz");
		
		Object.defineProperty(this, "_parent", { value: parent });

		Object.defineProperty(this, "_channel", { value: channel });
		Object.defineProperty(this, "_created", { value: data.created });
		Object.defineProperty(this, "_temp", { value: data.temp, writable: true });
		Object.defineProperty(this, "_name", { value: data.name, writable: true });
		Object.defineProperty(this, "_owner", { value: data.owner, writable: true });
		Object.defineProperty(this, "_type", { value: data.type, writable: true });
		Object.defineProperty(this, "_mods", { value: new Set(data.mods) });
		Object.defineProperty(this, "_members", { value: new Set(data.members) });
		Object.defineProperty(this, "_banneds", { value: new Set(data.banneds) });
		Object.defineProperty(this, "_antiadmin", { value: data.antiadmin, writable: true });
		Object.defineProperty(this, "_antibots", { value: data.antibots, writable: true });
		Object.defineProperty(this, "_visible", { value: data.visible, writable: true });
		Object.defineProperty(this, "_onlycam", { value: data.onlycam, writable: true });
	}

	debug(msg) { this._manager._plugin.log(Level.DEBUG, msg); }
	error(msg) { this._manager._plugin.log(Level.ERROR, msg); }

	get _idbd() { return this._parent._idbd; }
	get _manager() { return this._parent._manager; }

	get id() { return this._channel.id; }
	get guild() { return this._channel.guild; }
	get channel() { return this._channel; }
	get created() { return this._created; }
	get temp() { return this._temp; }
	get name() { return this._name; }
	get owner() { return this._owner; }
	get type() { return this._type; }
	get mods() { return this._mods; }
	get members() { return this._members; }
	get banneds() { return this._banneds; }
	get antiadmin() { return this._antiadmin; }
	get antibots() { return this._antibots; }
	get visible() { return this._visible; }
	get onlycam() { return this._onlycam; }

	get count() { return this.channel.members.size; }
	

	// Setters
	async setTemp(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET temp = ? WHERE channel = ?`, data, this.id);
		this._temp = data;
		this.shouldbeDeleted();
	}
	async setName(data, editChannel = true) {
		if(typeof data != "string")
			throw new Error(`Se debe proporcionar una cadena`);
		if(data == this._name)
			return;
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET name = ? WHERE channel = ?`, data, this.id);
		this._name = data;
		if(editChannel) await this.channel.edit({ name: this._name });
	}
	async setOwner(data) {
		if(await this.guild.members.fetch(data).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User válido");
		if(typeof data == "string") data = { id: data };
		if(data.id == this.guild.id)
			throw new Error(`No se puede añadir esta ID como dueño`);
		// Tambien hay que darselo al canal
		// Y eliminarlo de mod, member, banned
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET owner = ? WHERE channel = ?`, data.id, this.id);
		this._owner = data;
		this.updateUserPerm(this.owner.id);
	}
	async setType(data) {
		if(!Object.values(Type).includes(data))
			throw new Error(`El valor debe ser alguno de estos: [${Object.values(Type)}]`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET type = ? WHERE channel = ?`, data, this.id);
		this._type = data;
		await this.reloadPerms();
	}
	async setAntiadmin(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET antiadmin = ? WHERE channel = ?`, data, this.id);
		this._antiadmin = data;
	}
	async setAntibots(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET antibots = ? WHERE channel = ?`, data, this.id);
		this._antibots = data;
	}
	async setVisible(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET visible = ? WHERE channel = ?`, data, this.id);
		this._visible = data;
		//await this.updateUserPerm(this.guild.id); se deben actualizar todos los baneados
		await this.reloadPerms();
	}
	async setOnlycam(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET onlycam = ? WHERE channel = ?`, data, this.id);
		this._onlycam = data;
	}


	// Mods
	async addMod(data) {
		if(await this.guild.members.fetch(data).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User válido");
		if(typeof data == "string") data = { id: data };
		if(data.id == this.owner.id)
			throw new Error(`No se puede añadir al dueño del canal`);
		if(data.id == this.guild.id)
			throw new Error(`No se puede añadir esta ID`);

		await this.delMember(data.id, false);
		await this.delBanned(data.id, false);
		if(!this._mods.has(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET mods = ? WHERE channel = ?`, [...this._mods, data.id].join(";"), this.id);
			this._mods.add(data.id);
			await this.updateUserPerm(data.id);
		}
	}
	async delMod(data, updateChannel=true) {
		if(!(data instanceof User) && !(data instanceof GuildMember) && typeof data != "string")
			throw new Error("Dato inválido");
		if(typeof data == "string") data = { id: data };

		if(this._mods.has(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET mods = ? WHERE channel = ?`, [...this._mods].deleteElement(data.id).join(";"), this.id);
			if(updateChannel && data.id != this.owner.id && data.id != this.guild.id) await this.channel.permissionOverwrites.delete(data.id);
			this._mods.delete(data.id);
		}
	}
	async setMods(data, reload=true) {
		if(!Array.isArray(data))
			throw new Error(`El valor debe ser un array`);
		data = [...new Set(data)];
		data.deleteElement(this.owner.id);
		data.deleteElement(this.guild.id);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET mods = ? WHERE channel = ?`, data.join(";"), this.id);
		this._mods.clear(); for(const e of data) this._mods.add(e);
		if(reload)
			await this.reloadPerms();
	}

	// Members
	async addMember(data) {
		if(await this.guild.members.fetch(data).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User válido");
		if(typeof data == "string") data = { id: data };
		if(data.id == this.owner.id)
			throw new Error(`No se puede añadir al dueño del canal`);
		if(data.id == this.guild.id)
			throw new Error(`No se puede añadir esta ID`);

		await this.delMod(data.id, false);
		await this.delBanned(data.id, false);
		if(!this._members.has(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET members = ? WHERE channel = ?`, [...this._members, data.id].join(";"), this.id);
			this._members.add(data.id);
			await this.updateUserPerm(data.id);
		}
	}
	async delMember(data, updateChannel=true) {
		if(!(data instanceof User) && !(data instanceof GuildMember) && typeof data != "string")
			throw new Error("Dato inválido");
		if(typeof data == "string") data = { id: data };

		if(this._members.has(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET members = ? WHERE channel = ?`, [...this._members].deleteElement(data.id).join(";"), this.id);
			if(updateChannel && data.id != this.owner.id && data.id != this.guild.id) await this.channel.permissionOverwrites.delete(data.id);
			this._members.delete(data.id);
		}
	}
	async setMembers(data, reload=true) {
		if(!Array.isArray(data))
			throw new Error(`El valor debe ser un array`);
		data = [...new Set(data)];
		data.deleteElement(this.owner.id);
		data.deleteElement(this.guild.id);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET members = ? WHERE channel = ?`, data.join(";"), this.id);
		this._members.clear(); for(const e of data) this._members.add(e);
		if(reload) await this.reloadPerms();
	}

	// Banneds
	async addBanned(data) {
		if(await this.guild.members.fetch(data).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User válido");
		if(typeof data == "string") data = { id: data };
		if(data.id == this.owner.id)
			throw new Error(`No se puede añadir al dueño del canal`);
		if(data.id == this.guild.id)
			throw new Error(`No se puede añadir esta ID`);

		await this.delMod(data.id, false);
		await this.delMember(data.id, false);
		if(!this._banneds.has(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET banneds = ? WHERE channel = ?`, [...this._banneds, data.id].join(";"), this.id);
			this._banneds.add(data.id);
			await this.updateUserPerm(data.id);
		}
	}
	async delBanned(data, updateChannel=true) {
		if(!(data instanceof User) && !(data instanceof GuildMember) && typeof data != "string")
			throw new Error("Dato inválido");
		if(typeof data == "string") data = { id: data };

		if(this._banneds.has(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET banneds = ? WHERE channel = ?`, [...this._banneds].deleteElement(data.id).join(";"), this.id);
			if(updateChannel && data.id != this.owner.id && data.id != this.guild.id) await this.channel.permissionOverwrites.delete(data.id);
			this._banneds.delete(data.id);
		}
	}
	async setBanneds(data, reload=true) {
		if(!Array.isArray(data))
			throw new Error(`El valor debe ser un array`);	
		data = [...new Set(data)];
		data.deleteElement(this.owner.id);
		data.deleteElement(this.guild.id);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET banneds = ? WHERE channel = ?`, data.join(";"), this.id);
		this._banneds.clear(); for(const e of data) this._banneds.add(e);
		if(reload) await this.reloadPerms();
	}


	// Funciones varias
	async shouldbeDeleted() {
		if(this.temp && this.count == 0)
			await this.delete();
	}

	async clear() {
		await this.setMods([], false);
		await this.setMembers([], false);
		await this.setBanneds([], false);
		await this.reloadPerms();
	}

	async delete(discDelete = true) {
		await this._idbd.execute(`DELETE FROM ${GestorCanales._tableName_channels} WHERE channel = ?;`, this.id);
		this.debug(`Canal(${this.id}) del guild(${this.guild.id}) eliminado`);
		this._parent.list.delete(this.id);
		if(discDelete) await this.channel.delete();
		return this;
	}

	async reloadPerms() {
		const perms = [
			{ id: this.guild.id, 	 ...GestorCanales._permsAllowDeny(this.type, CRol.NONE, this.visible) },
			{ id: this.owner.id, 	 ...GestorCanales._permsAllowDeny(this.type, CRol.OWNER, true) },
		];
		for (const userID of this.mods)
			if(await this.guild.members.fetch(userID).then(() => true).catch(() => false))
				perms.push({ id: userID, ...GestorCanales._permsAllowDeny(this.type, CRol.MOD, this.visible) });
		for (const userID of this.members)
			if(await this.guild.members.fetch(userID).then(() => true).catch(() => false))
				perms.push({ id: userID, ...GestorCanales._permsAllowDeny(this.type, CRol.MEMBER, this.visible) });
		for (const userID of this.banneds)
			if(await this.guild.members.fetch(userID).then(() => true).catch(() => false))
				perms.push({ id: userID, ...GestorCanales._permsAllowDeny(this.type, CRol.BANNED, this.visible) });
		await this.channel.permissionOverwrites.set(perms);
	}

	/**
	 * Devuelve el número de rol que un usuario tiene
	 * en el canal.
	 * 
	 * @param {int} userID ID de usuario
	 * @return -1: no rank
	 *          0: owner
	 *          1: mod
	 *          2: member
	 *          3: banned
	 */
	getUserRol(userID) {
		if(this.guild.id == userID)
			return CRol.NONE;
		if(this.owner.id == userID)
			return CRol.OWNER;
		if(this.mods.has(userID))
			return CRol.MOD;
		if(this.members.has(userID))
			return CRol.MEMBER;
		if(this.banneds.has(userID))
			return CRol.BANNED;
		return -1;
	}

	async updateUserPerm(userID) {
		if(userID != this.guild.id && await this.guild.members.fetch(userID).then(() => false).catch(() => true))
			return;
		const userRol = this.getUserRol(userID);
		if(userRol == -1)
			return await this.channel.permissionOverwrites.delete(userID);
		const perms = RolPerms[this.type][CRol.getKeyByValue(userRol)].clone();
		if(!this.visible)
			if(
				(this.type == Type.PUBLIC && userRol == CRol.BANNED) ||
				(this.type > Type.PUBLIC && userRol == CRol.NONE)
			) perms.ViewChannel = false;
		await this.channel.permissionOverwrites.edit(userID, perms);
	}

	embed() {
		return GestorCanales._getEmbedInfoChannel(this);
	}
	async embedMods() {
		return GestorCanales._getEmbedInfoChannelMods(this);
	}
	async embedMembers() {
		return GestorCanales._getEmbedInfoChannelMembers(this);
	}
	async embedBanneds() {
		return GestorCanales._getEmbedInfoChannelBanneds(this);
	}

	toJSON() {
		return {
			guild: this.guild.id,
			channel: this.id,
			created: this.created,
			temp: this.temp,
			name: this.name,
			owner: this.owner.id,
			type: this.type,
			mods: [...this.mods],
			members: [...this.members],
			banneds: [...this.banneds],
			antiadmin: this.antiadmin,
			antibots: this.antibots,
			visible: this.visible,
			onlycam: this.onlycam,
			count: this.count,
		}
	}
}




/*

BD canales:
------------

Guild
- guild: string GuildID PK
- channel_category: string ChannelID DEFAULT NULL
- channel_text: string ChannelID DEFAULT NULL
- channel_voice: string ChannelID DEFAULT NULL
- default_channelname: string DEFAULT '🐇 $USER'
- default_type: INT [0, 1, 2, 3] DEFAULT 0
- default_antiadmin: boolean DEFAULT false
- default_antibots: boolean DEFAULT false
- default_visible: boolean DEFAULT true
- default_onlycam: boolean DEFAULT false

Canal
- guild: string GuildID <- foreign key ->
- channel: string ChannelID PK
- created: datetime
- temp: boolean
- name: string
- owner: string UserID
- type: INT [0, 1, 2, 3]
- mods: UserID[]
- members: UserID[]
- banneds: UserID[]
- antiadmin: boolean
- antibots: boolean
- visible: boolean
- onlycam: boolean

*/