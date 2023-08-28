import fs from "fs";
import path from "path"
import { createDirs, getDate } from "../../libraries/utils.mjs";
import { SearchResult, Track, Util } from "./DiscordPlayer.cjs"
import { User } from "discord.js";
import Sqlite from "../../libraries/SQL_sqlite3.js";

export class MyPlaylist {

	/**
	 * Campos que contiene el json:
     * - title
     * - description
     * - author
     * - url
     * - thumbnail
     * - duration (ms)
	 */
	static _toJSON(track) {
		if(!(track instanceof Track))
			return {};
		const json = track.toJSON(true);
		delete json.id;
		delete json.requestedBy;
		delete json.playlist;
		delete json.views;
		json.duration = json.durationMS;
		delete json.durationMS;
		return json;
	}

	static filterData(data) {
		if(!data)
			return null;
		delete data.id_playlist;
		delete data.pos;
		return data;
	}

	static readableDuration(duration) {
		return Util.buildTimeCode(Util.parseMS(duration));
	}

	constructor(parent, id, name, options) {
		Object.defineProperty(this, "_parent", { value: parent });

		Object.defineProperty(this, "_id", { value: id });
		Object.defineProperty(this, "_name", { value: name, writable: true });
		Object.defineProperty(this, "_description", { value: options?.description ?? "", writable: true });
		Object.defineProperty(this, "_date", { value: options?.date ?? getDate() });
		Object.defineProperty(this, "_size", { value: options?.size ?? 0, writable: true });
		Object.defineProperty(this, "_lastPos", { value: options?.pos ?? 1, writable: true });
	}

	get _data() { return this._parent._data; }
	get id() { return this._id; }
	get name() { return this._name; }
	get description() { return this._description; }
	get date() { return this._date; }
	get index() { return this._parent.lists.indexOf(this); }
	get size() { return this._size; }

	
	async getList(offset, limit=1) { return await this._data.rows(`SELECT * FROM ${PlaylistManager._tableName_tracks} WHERE id_playlist = ? ORDER BY pos ASC${offset===undefined ? "" : ` LIMIT ${limit} OFFSET ${offset}`};`, this.id); }
	async setName(name) { this._data.execute(`UPDATE ${PlaylistManager._tableName_playlists} SET name = ? WHERE id = ?;`, name, this.id); this._name = name; }
	async setDescription(description=null) { this._data.execute(`UPDATE ${PlaylistManager._tableName_playlists} SET description = ? WHERE id = ?;`, description, this.id); this._description = description; }
	async at(index) { return index >= 0 && index < this.size ? this.constructor.filterData(await this._data.row(`SELECT * FROM ${PlaylistManager._tableName_tracks} WHERE id_playlist = ? ORDER BY pos ASC LIMIT 1 OFFSET ?;`, [this.id, index])) : null; }
	async clear() { this._data.execute(`DELETE FROM ${PlaylistManager._tableName_tracks} WHERE id_playlist = ?`, this.id); this._size = 0; }
	async delete() { await this._parent.remove(this.index); }
	async getTotalDuration() { return parseInt((await this._data.row(`SELECT COALESCE(SUM(duration), 0) as totalDuration FROM tracks WHERE id_playlist = ?;`, this.id)).totalDuration); }


	// Se pueden eliminar varios
	async remove(index, size=1) {
		if(index < 0 || index >= this.size) return [];
			
		const deletedTracks = await this.getList(index, size);
		await this._data.execute(`
			DELETE FROM ${PlaylistManager._tableName_tracks}
			WHERE id_playlist = ? AND url IN (
				SELECT url
				FROM ${PlaylistManager._tableName_tracks}
				WHERE id_playlist = ?
				ORDER BY pos ASC
				LIMIT ? OFFSET ?
			);`, [this.id, this.id, size, index]);
		this._size -= deletedTracks.length;
		return deletedTracks;
	}

	async _add(tracks) {
		const tracksBD = await this.getList() ?? [];
		tracks = (Array.isArray(tracks) ? tracks : [tracks]).filter2(track => !tracksBD.find(tr => tr.url == track.url));
		for (const track of tracks) {
			await this._data.execute(
				`INSERT INTO tracks (id_playlist, pos, url, title, description, author, thumbnail, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
				[this.id, ++this._lastPos, track.url, track.title, track.description ?? null, track.author ?? null, track.thumbnail ?? null, track.durationMS ?? track.duration ?? 0]
			);
			this._size++;
		}
		return tracks;
	}

	async add(searchResult) {
		if(!(searchResult instanceof SearchResult))
			throw new Error("Se debe introducir un SearchResult");
		return await this._add(searchResult.tracks);
	}

	async search(url, options={}) {
		console.log("entramos aki jiji");
		return await this._parent._manager._musicController.search(url, options);
	}

	async _getTracks(pos1, pos2, user) {
		const tracksBD = await this.getList();
		const tracks = [];
		for (let index = pos1; index <= pos2; index++)
			tracks.push((await this.search(tracksBD[index].url, { requestedBy: user })).tracks[0]);
		return tracks;
	}

	async getTracks(pos1, pos2, user) {
		const tracksBD = await this.getList();
		const tracks = [];
		for (let index = pos1; index <= pos2; index++)
			tracks.push((await this.search(tracksBD[index].url, { requestedBy: user })).tracks[0]);
		return tracks.map(t => this.constructor.filterData(t));
	}

	async getTrack(index, user) {
		return (await this.getTracks(index, index, user))[0];
	}

	toJSON() {
		return {
			name: this.name,
			description: this.description,
			date: this.date,
			tracks: this.size
		};
	}

	async embed(pag, pagSize) {
		pag = pag < 0 ? this.size : pag;
		const pagMax = Math.ceil(this.size / pagSize) - 1;
		const sl1 = pag * pagSize;
		const duration = await this.getTotalDuration();
		var tracksBD = [];

		let pagView = pag + 1;
		if(this.size == 0)
			pagView = 0;
		else if(pag < 0 || pag > pagMax)
			pagView = "?";
		else
			tracksBD = await this.getList(sl1, pagSize);

		return {
			title: `[${(this.index+1)}] ${this.name}`,
			description: [
				this.description!="" ? `**Descripción**\n${this.description}` : null,
				``,
				`**Tracks [${pagView}/${pagMax+1}]**`,
				this.size > 0 ?
					tracksBD
						.map((track, i) => `**${sl1+i+1}.** [${track.title.suspensivos(64)}](${track.url}) ${this.constructor.readableDuration(track.duration)}`)
						.join("\n") :
					"No hay canciones"
			]
				.filter(e => e!=null)
				.join("\n")
				.suspensivos(4096, "#!#"),

			fields: [
				{
					name: "Estadísticas",
					value: [
						`Cantidad canciones: ${this.size}`,
						`Tiempo total: ${this.constructor.readableDuration(duration)}`,
					].join("\n")
				},
			]
		};
	}
}

export class UserPlaylist {
	constructor(user, manager) {
		Object.defineProperty(this, "_manager", { value: manager });

		Object.defineProperty(this, "_id", { value: user.id });
		Object.defineProperty(this, "_tag", { value: user.tag });
		Object.defineProperty(this, "_lists", { value: [] });
		Object.defineProperty(this, "_file", { value: this._manager.getFilePath(this._id) });

		Object.defineProperty(this, "_data", { value: new Sqlite(this._file) });
	}

	get id() { return this._id; }
	get tag() { return this._tag; }
	get lists() { return this._lists.slice(); }
	get size() { return this._lists.length; }

	// BD
	async load() {
		if(this._manager.exists(this.id)) {
			await this._data.connect([`PRAGMA foreign_keys = ON;`]);
			for (const myPlaylistObj of await this._data.rows(`SELECT * FROM ${PlaylistManager._tableName_playlists};`)) {
				const infoTracks = await this._data.row(`SELECT COUNT(*) as count, MAX(pos) lastpos FROM ${PlaylistManager._tableName_tracks} WHERE id_playlist = ?;`, myPlaylistObj.id);
				this._lists.push(new MyPlaylist(this, myPlaylistObj.id, myPlaylistObj.name, {
					description: myPlaylistObj.description,
					date: new Date(myPlaylistObj.date),
					size: infoTracks.count,
					pos: infoTracks.lastpos ?? 0
				}));
			}
		}
		else {
			createDirs(path.dirname(this._file));
			await this._data.connect([`PRAGMA foreign_keys = ON;`]);
			await this._data.execute(PlaylistManager._table_playlists);
			await this._data.execute(PlaylistManager._table_tracks);
		}
		return this;
	}

	at(position) {
		return this._lists[position] ?? null;
	}

	// BD
	async create(name, option) {
		if(this._lists.length >= PlaylistManager._maxlists)
			throw new Error("Máximo de listas excedido");

		const { lastID } = await this._data.execute(`INSERT INTO ${PlaylistManager._tableName_playlists} (name, description) VALUES (?, ?);`, [name, option?.description ?? null]);
		const myPlaylist = new MyPlaylist(this, lastID, name, option);
		this._lists.push(myPlaylist);
		return myPlaylist;
	}

	// BD
	async remove(index) {
		if(index >= 0 && index < this.size) {
			const myPlaylist = this._lists[index];
			console.log(`Eliminar: ${myPlaylist.id}`);
			await this._data.execute(`DELETE FROM ${PlaylistManager._tableName_playlists} WHERE id = ?`, myPlaylist.id);
			this._lists.splice(index, 1);
			return myPlaylist;
		}
		return null;
	}

	async close() {
		await this._data.close();
	}

	toJSON() {
		return {
			id: this._id,
			tag: this._tag,
			lists: this._lists.map(mpl => mpl.toJSON())
		};
	}

	async embed() {
		return {
			title: `Mis playlist`,
			fields: await this._lists.mapAsync(async (list, i) => {
				return {
					name: `[${(i+1)}] - ${list.name}`,
					value: [
						`Creado el: ${list.date.format("Y-m-d H:i")}`,
						list.description!="" ? `Description: ${list.description}` : null,
						`Tracks: ${list.size}`,
						`Duración: ${MyPlaylist.readableDuration(await list.getTotalDuration())}`,
					].filter(e => e!=null).join("\n")
				};
			})
		};
	}
}

export default class PlaylistManager {
	static _maxlists = 10;
	static _srcFile = "data/playlists";
	static _tableName_playlists = "playlists";
	static _tableName_tracks = "tracks";
	static _table_playlists = `CREATE TABLE IF NOT EXISTS ${this._tableName_playlists} (
		id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
		name VARCHAR(128) NOT NULL,
		description TEXT,
		date DATETIME DEFAULT (datetime('now', 'localtime'))
	);`;
	static _table_tracks = `CREATE TABLE IF NOT EXISTS ${this._tableName_tracks} (
		id_playlist INTEGER NOT NULL,
		pos INTEGER NOT NULL,
		url VARCHAR(255) NOT NULL,
		title VARCHAR(128) NOT NULL,
		description TEXT,
		author VARCHAR(128),
		thumbnail VARCHAR(255),
		duration INTEGER,
		PRIMARY KEY (id_playlist, url),
		UNIQUE (id_playlist, pos),
		FOREIGN KEY (id_playlist) REFERENCES ${this._tableName_playlists}(id) ON DELETE CASCADE
	);`;

	constructor(musicController) {
		Object.defineProperty(this, "_musicController", { value: musicController });
		Object.defineProperty(this, "_pluginPath", { value: musicController.module.thisPath });
	}

	/**
	 * Obtiene la ruta donde debería encontrarse almacenado
	 * el fichero con los datos de un usuario
	 * 
	 * @param {string} id ID de discord del usuario
	 * @returns Devuelve la ruta
	 */
	getFilePath(id) {
		return path.join(this._pluginPath, this.constructor._srcFile, `user_${id}.sqlite`);
	}

	/**
	 * Comprueba si existe el fichero de datos de un usuario
	 * 
	 * @param {string} id ID de discord del usuario
	 * @returns true si existe el fichero
	 */
	exists(id) {
		return fs.existsSync(this.getFilePath(id));
	}

	/**
	 * Devuelve un objeto de tipo UserPlaylist asociado
	 * al usuario, si no existe se crea con su fichero correspondiente
	 * 
	 * @param {User} user Usuario de discord
	 * @returns objeto de tipo Promise<UserPlaylist>
	 */
	async create(user) {
		if(!(user instanceof User))
			throw new Error("El parámetro debe ser de tipo User");
		return (new UserPlaylist(user, this)).load();
	}

	/**
	 * Devuelve un objeto de tipo UserPlaylist en caso
	 * de existir, si no devuelve null
	 * 
	 * @param {User} user Usuario de discord
	 * @returns objeto de tipo Promise<UserPlaylist> o null
	 */
	async get(user) {
		if(!(user instanceof User))
			throw new Error("El parámetro debe ser de tipo User");
		return this.exists(user.id) ? this.create(user) : null;
	}
}