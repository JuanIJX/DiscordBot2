import path from "path"
import fsPromise from "fs/promises"
import { BaseChannel, ChannelType, Collection, GuildMember, User } from "discord.js"
import { createDirs, wait } from "../../libraries/utils.mjs";
import Sqlite from "../../libraries/SQL_sqlite3.js";
import { Level } from "../../libraries/logger.js";

export const Type = {
	PUBLIC: 0,
	PRIVATE: 1,
	SECRET: 2,
	CLOSED: 3,
};

export default class GestorCanales {
	static _defaultNameCategory = "< ( * -=- * ) > AutoCanales < ( * -=- * ) > (N)";
	static _defaultNameText = "📝comandos (N)";
	static _defaultNameVoice = "➕ Crear canal (N)";
	static _srcFile = "data";
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
	static getEmbedHelp = cmdname => {
		return {
			title: `Información sobre el grupo de canales`,
			color: 0xFF0092,
			description: `Para crear un canal simplemente entra a la sala de auto-crear y automáticamente tendrás tu canal temporal 🕯.`,
			fields: [
				{
					name: `${cmdname} lock <0, 1, 2, 3>`,
					value: `Abre o cierra el canal
						🔓 (0): Todos menos baneados
						🔒 (1): Solo miembros, mods y creador
						🔐 (2): Mods y creador
						🔏 (3): Solo creador`
				},
				{
					name: `${cmdname} mod <add, del> <@mentionUser1> <@mentionUser2> ...`,
					value: `Añade o elimina un/os moderador/es al grupo de canales`
				},
				{
					name: `${cmdname} member <add, del> <@mentionUser1> <@mentionUser2> ...`,
					value: `Añade o elimina un/os miembro/s al grupo de canales`
				},
				{
					name: `${cmdname} ban <@mentionUser>`,
					value: `Banea o desbanea a un usuario del grupo de canales`
				},
				{
					name: `${cmdname} unban <@mentionUser>`,
					value: `Banea o desbanea a un usuario del grupo de canales`
				},
				{
					name: `${cmdname} kick <@mentionUser1> <@mentionUser2> ...`,
					value: `Expulsa a usuario/s de la sala`
				},
				{
					name: `${cmdname} set name`,
					value: `Cambia el nombre de la categoría (en construccion)`
				},
				{
					name: `${cmdname} set name_t`,
					value: `Cambia el nombre del canal de texto (en construccion)`
				},
				{
					name: `${cmdname} set name_v`,
					value: `Cambia el nombre del canal de voz (en construccion)`
				},
				{
					name: `${cmdname} set type <perm, 0, 1, 2...>`,
					value: `Establece el tiempo de duración del canal (segundos)`
				},
				{
					name: `${cmdname} set type antiadmin`,
					value: `Activa/desactiva el antiadmin del canal`
				},
				{
					name: `${cmdname} set type antibots`,
					value: `Permite la entrada de bots sin añadir`
				},
				{
					name: `${cmdname} set inv`,
					value: `Pone invisible o visible el canal
					🙉 Invisibilidad desactivada
					🙈 Invisibilidad activada`
				},
				{
					name: `${cmdname} set antiadmin`,
					value: `Activa/desactiva el antiadmin`
				},
			],
			footer: {
				name: `Ayuda sobre los comandos`,
				value: `this.main.bot.user.displayAvatarURL()`
			}
		};
	}

	/**
	 * 
	 * @param {String} pluginPath 
	 */
	constructor(plugin) {
		
		Object.defineProperty(this, "_plugin", { value: plugin });
		Object.defineProperty(this, "_pluginPath", { value: plugin.thisPath });
		Object.defineProperty(this, "discordManager", { value: plugin.discordManager });
		Object.defineProperty(this, "_list", { value: new Collection() });
	}

	get _pluginPath() { return this._plugin.thisPath; }
	get discordManager() { return this._plugin.discordManager; }

	get list() { return this._list; }

	//
	debug(msg) { this._plugin.log(Level.DEBUG, msg); }
	error(msg) { this._plugin.log(Level.ERROR, msg); }

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
					this.debug(`Guild(${this.id}) cargado`);
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
		return path.join(this._pluginPath, this.constructor._srcFile, `guild_${id}.sqlite`);
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
			type: ChannelType.GuildCategory
		});
		const text = await guild.channels.create({
			name: options.text ?? this.constructor._defaultNameText,
			type: ChannelType.GuildText,
			parent: category
		});
		const voice = await guild.channels.create({
			name: options.voice ?? this.constructor._defaultNameVoice,
			type: ChannelType.GuildVoice,
			parent: category
		});

		const msg = await text.send(this._plugin.getEmbed(this.constructor.getEmbedHelp("canal")));
		for (let em of [ '🔏', '🔐', '🔒', '🔓', '🙉', '🙈' ])
			await msg.react(em);
		
		const guildCanal = await new GuildCanal(this, guild, {
			category,
			text,
			voice,
		}).initLoad();
		this._list.set(guild.id, guildCanal);
		this.debug(`Creado el guild(${guild.id})`);
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
		return await fsPromise.unlink(this.getFilePath(id));
	}


	// Eventos
	messageReactionAdd(messageReaction, user) {
		this._messageReactionAdd(messageReaction, user);
	}
	channelDelete(channel) {
		this._channelDelete(channel);
	}
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

	async _messageReactionAdd(reaction, user) {
		if(this.list.has(reaction.message.channel.guild.id)) {
			const guildCanal = this.list.get(reaction.message.channel.guild.id);
			if(guildCanal.text.id === reaction.message.channel.id) {
				await reaction.users.remove(user.id);

				console.log(reaction.emoji.name);
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
		}
	}

	async _joinEvent(channel, member) {
		if(this.list.has(channel.guild.id)) {
			const guildCanal = this.list.get(channel.guild.id);
			if(guildCanal.voice.id === channel.id) {
				const canal = await guildCanal.createCanal(member.user);
				await member.voice.setChannel(canal.channel);
			}
		}
	}

	async _leaveEvent(channel) {
		if(this.list.has(channel.guild.id)) {
			const guildCanal = this.list.get(channel.guild.id);
			if(guildCanal.list.has(channel.id)) {
				const canal = guildCanal.list.get(channel.id);
				if(canal.temp && canal.count == 0)
					await canal.delete();
				/*else
					console.log(`channel.id: ${channel.id}, temp: ${canal.temp}, count: ${canal.count}`);*/
			}
			/*else
				console.log(`channel.id: ${channel.id}`);*/
		}
		/*else
			console.log(`Guild: ${channel.guild.id}`);*/
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
			const owner = await this._guild.members.fetch(canalObj.owner).then(member => member.user).catch(() => null)
			if(owner == null) {
				await this._idbd.execute(`DELETE FROM ${GestorCanales._tableName_channels} WHERE owner = ?;`, canalObj.owner);
				continue;
			}

			const canal = new Canal(this, channel, {
				created: new Date(canalObj.created),
				temp: canalObj.temp == 1 ? true : false,
				name: canalObj.name,
				owner,
				type: parseInt(canalObj.type),
				mods: canalObj.mods.split(";"),
				members: canalObj.members.split(";"),
				banneds: canalObj.banneds.split(";"),
				antiadmin: canalObj.antiadmin == 1 ? true : false,
				antibots: canalObj.antibots == 1 ? true : false,
				visible: canalObj.visible == 1 ? true : false,
				onlycam: canalObj.onlycam == 1 ? true : false,
			});
			this._list.set(channel.id, canal);
			if(canal.temp && canal.count == 0)
				await canal.delete();
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

	// Eliminar guild
	async delete() {
		const channels = this.list.map(canal => canal.channel);
		await this.disconnect();
		this.debug(`Eliminado el guild(${this.id})`);

		for (const channel of channels)
			await channel.delete();

		if(this.category != null && await this.guild.channels.fetch(this.category.id).then(() => true).catch(() => false))
			await this.guild.channels.delete(this.category);
		if(this.text != null && await this.guild.channels.fetch(this.text.id).then(() => true).catch(() => false))
			await this.guild.channels.delete(this.text);
		if(this.voice != null && await this.guild.channels.fetch(this.voice.id).then(() => true).catch(() => false))
			await this.guild.channels.delete(this.voice);
	}

	/**
	 * Desconecta de la base de datos, elimina el fichero
	 * y elimina del listado del guilds
	 */
	async disconnect() {
		await this.close();
		await this._manager.deleteFile(this.id);
		this._manager.list.delete(this.id);
	}

	// Crear canal
	async createCanal(owner) {
		if(!(owner instanceof User))
			throw new Error("Se debe proporcionar un User");
		if(await this.guild.members.fetch(owner.id).then(() => false).catch(() => true))
			throw new Error("El miembro no se encuentra en el servidor");

		const channelName = this.defaultChannelname.replace(`$USER`, owner.tag)
		const channel = await this.guild.channels.create({
			name: channelName,
			type: ChannelType.GuildVoice,
			parent: this.category
		});
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
		this._list.set(channel.id, canal);
		return canal;
	}

	// Cerrar conexion a la base de datos
	async close() {
		await this._idbd.close();
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
		Object.defineProperty(this, "_mods", { value: data.mods, writable: true });
		Object.defineProperty(this, "_members", { value: data.members, writable: true });
		Object.defineProperty(this, "_banneds", { value: data.banneds, writable: true });
		Object.defineProperty(this, "_antiadmin", { value: data.antiadmin, writable: true });
		Object.defineProperty(this, "_antibots", { value: data.antibots, writable: true });
		Object.defineProperty(this, "_visible", { value: data.visible, writable: true });
		Object.defineProperty(this, "_onlycam", { value: data.onlycam, writable: true });
	}

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
	}
	async setName(data) {
		if(typeof data != "string")
			throw new Error(`Se debe proporcionar una cadena`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET name = ? WHERE channel = ?`, data, this.id);
		this._name = data;
	}
	async setOwner(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		// Tambien hay que darselo al canal
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET owner = ? WHERE channel = ?`, data, this.id);
		this._owner = data;
	}
	async setType(data) {
		if(!Object.values(Type).includes(data))
			throw new Error(`El valor debe ser alguno de estos: [${Object.values(Type)}]`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET type = ? WHERE channel = ?`, data, this.id);
		this._type = data;
	}

	// Mods
	async addMod(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		if(!this._mods.includes(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET mods = ? WHERE channel = ?`, [...this._mods, data.id].join(";"), this.id);
			this.mods.push(data.id);
		}
	}
	async delMod(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		if(!this._mods.includes(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET mods = ? WHERE channel = ?`, [...this._mods, data.id].join(";"), this.id);
			this.mods.push(data.id);
		}
	}
	async _setMods(data) {
		if(!Array.isArray(data))
			throw new Error(`El valor debe ser un array`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET mods = ? WHERE channel = ?`, data.join(";"), this.id);
		this._mods = data;
	}

	// Members
	async addMember(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		if(!this._members.includes(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET members = ? WHERE channel = ?`, [...this._members, data.id].join(";"), this.id);
			this.members.push(data.id);
		}
	}
	async delMember(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		if(!this._members.includes(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET members = ? WHERE channel = ?`, [...this._members, data.id].join(";"), this.id);
			this.members.push(data.id);
		}
	}
	async _setmembers(data) {
		if(!Array.isArray(data))
			throw new Error(`El valor debe ser un array`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET members = ? WHERE channel = ?`, data.join(";"), this.id);
		this._members = data;
	}

	// Banneds
	async addBanned(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		if(!this._banneds.includes(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET banneds = ? WHERE channel = ?`, [...this._banneds, data.id].join(";"), this.id);
			this.banneds.push(data.id);
		}
	}
	async delBanned(data) {
		if(await this.guild.members.fetch(data?.id).then(() => false).catch(() => true))
			throw new Error("Se debe proporcionar un User");
		if(!this._banneds.includes(data.id)) {
			await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET banneds = ? WHERE channel = ?`, [...this._banneds, data.id].join(";"), this.id);
			this.banneds.push(data.id);
		}
	}
	async _setBanneds(data) {
		if(!Array.isArray(data))
			throw new Error(`El valor debe ser un array`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET banneds = ? WHERE channel = ?`, data.join(";"), this.id);
		this._banneds = data;
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
	}
	async setOnlycam(data) {
		if(typeof data != "boolean")
			throw new Error(`Se debe proporcionar true o false`);
		await this._idbd.execute(`UPDATE ${GestorCanales._tableName_channels} SET onlycam = ? WHERE channel = ?`, data, this.id);
		this._onlycam = data;
	}

	//
	async delete() {
		await this._idbd.execute(`DELETE FROM ${GestorCanales._tableName_channels} WHERE channel = ?;`, this.id);
		await this.channel.delete();
		this._parent.list.delete(this.id);
		return this;
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