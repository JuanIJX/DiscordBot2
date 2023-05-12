import fs from "fs";
import path from "path"
import Config from "../../libraries/config.js";
import { getDate } from "../../libraries/utils.mjs";
import { Player, SearchResult, Track, Util } from "./DiscordPlayer.cjs"
import { User } from "discord.js";

export class MyPlaylist {

	/**
	 * Campos que contiene el json:
     * - title
     * - description
     * - author
     * - url
     * - thumbnail
     * - duration
     * - durationMS
	 * 
	 */
	static _toJSON(track) {
		if(!(track instanceof Track))
			return {};
		const json = track.toJSON(true);
		delete json.id;
		delete json.requestedBy;
		delete json.playlist;
		delete json.views;
		return json;
	}

	constructor(parent, name, options) {
		Object.defineProperty(this, "_parent", { value: parent });
		Object.defineProperty(this, "_name", { value: name, writable: true });
		Object.defineProperty(this, "_description", { value: options?.description ?? "", writable: true });
		Object.defineProperty(this, "_date", { value: options?.date ?? getDate() });
		Object.defineProperty(this, "_tracks", { value: [] });
	}

	get index() { return this._parent.lists.indexOf(this); }
	get size() { return this._tracks.length; }
	get name() { return this._name; }
	get description() { return this._description; }
	get date() { return this._date; }
	get tracks() { return this._tracks; }
	get totalDuration() { return Util.buildTimeCode(Util.parseMS(this.tracks.reduce((a, c) => a + c.durationMS, 0))); }

	async search(song, options={}) { return await this._parent.manager.player.search(song, options); }
	save() { this._parent.save(); }
	setName(name) { this._name = name; }
	setDescription(description) { this._description = description; }
	at(index) { return index >= 0 && index < this.size ? this.tracks[index] : null; }
	clear() { this._tracks.splice(0, this.size); }
	delete() { this._parent.remove(this.index); }

	remove(index, size=1) {
		if(index < 0 || index >= this.size)
			return [];

		const deletedTracks = this._tracks.slice(index, index + size);
		this._tracks.splice(index, size);
		return deletedTracks;
	}

	add(searchResult) {
		if(!(searchResult instanceof SearchResult))
			throw new Error("Se debe introducir un SearchResult");

		const tracks = searchResult.tracks
			.filter(track => !this.tracks.find(tr => tr.url == track.url))
			.map(track => this.constructor._toJSON(track));
		this.tracks.push(...tracks);
		return tracks;
	}

	async addSearch(song) {
		const searchResult = await this.search(song);
		if(!searchResult.hasTracks())
			return [];
		return this.add(searchResult);
	}

	async getTracks(pos1, pos2, user) {
		const tracks = [];
		for (let index = pos1; index <= pos2; index++)
			tracks.push((await this.search(this.tracks[index].url, { requestedBy: user })).tracks[0]);
		return tracks;
	}

	async getTrack(index, user) {
		return (await this.getTracks(index, index, user))[0];
	}

	addTracksJson(tracksJson) { this.tracks.push(...tracksJson); }
	toJSON() {
		return {
			name: this.name,
			description: this.description,
			date: this.date,
			tracks: this.tracks
		};
	}

	embed(pag, pagSize) {
		const pagMax = Math.ceil(this.size / pagSize) - 1;
		pag = pag < 0 ? this.size : pag;
		const sl1 = pag * pagSize;
		const sl2 = sl1 + pagSize;

		let pagView = pag + 1;
		if(this.size == 0)
			pagView = 0;
		else if(pag < 0 || pag > pagMax)
			pagView = "?";

		return {
			title: `[${(this.index+1)}] ${this.name}`,
			description: [
				this.description!="" ? `**Descripción**\n${this.description}` : null,
				``,
				`**Tracks [${pagView}/${pagMax+1}]**`,
				this.size > 0 ?
					this.tracks
						.slice(sl1, sl2)
						.map((track, i) => `**${sl1+i+1}.** [${track.title.suspensivos(64)}](${track.url}) ${track.duration}`)
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
						`Tiempo total: ${Util.buildTimeCode(Util.parseMS(this.tracks.reduce((a, c) => a + c.durationMS, 0)))}`,
					].join("\n")
				},
			]
		};
	}
}

export class UserPlaylist {
	static _maxlists = 10;

	constructor(user, manager) {
		Object.defineProperty(this, "manager", { value: manager });
		Object.defineProperty(this, "_id", { value: user.id });
		Object.defineProperty(this, "_tag", { value: user.tag });
		Object.defineProperty(this, "_created", { value: getDate(), writable: true });
		Object.defineProperty(this, "_lists", { value: [] });
		Object.defineProperty(this, "_file", { value: manager.getFilePath(this._id) });
		Object.defineProperty(this, "_config", { value: new Config(this._file, this.toJSON()) });

		this._created = this._config.content.created;
		for (const myPlaylistJson of this._config.content.lists) {
			const myPlaylist = new MyPlaylist(this, myPlaylistJson.name, {
				description: myPlaylistJson.description,
				date: new Date(myPlaylistJson.date),
			});
			myPlaylist.addTracksJson(myPlaylistJson.tracks);
			this._lists.push(myPlaylist);
		}
	}

	get id() { return this._id; }
	get tag() { return this._tag; }
	get created() { return this._created; }
	get lists() { return this._lists.slice(); }
	get size() { return this._lists.length; }

	save() {
		this._config.save(this.toJSON());
	}

	at(position) {
		return this._lists[position] ?? null;
	}

	create(name, track, options) {
		if(this._lists.length >= this.constructor._maxlists)
			throw new Error("Máximo de listas excedido");

		const myPlaylist = new MyPlaylist(this, name, options);
		if(track)
			myPlaylist.add(track, false);
		this._lists.push(myPlaylist);
		return myPlaylist;
	}

	remove(index) {
		if(index >= 0 && index < this.size) {
			const myPlaylist = this._lists[index];
			this._lists.splice(index, 1);
			return myPlaylist;
		}
		return null;
	}

	toJSON() {
		return {
			id: this._id,
			tag: this._tag,
			created: this._created,
			lists: this._lists.map(mpl => mpl.toJSON())
		};
	}

	embed() {
		return {
			title: `Mis playlist`,
			fields: this._lists.map((list, i) => {
				return {
					name: `[${(i+1)}] - ${list.name}`,
					value: [
						`Creado el: ${list.date.format("Y-m-d H:i")}`,
						list.description!="" ? `Description: ${list.description}` : null,
						`Tracks: ${list.size}`,
						`Duración: ${list.totalDuration}`,
					].filter(e => e!=null).join("\n")
				};
			})
		};
	}
}

export default class PlaylistManager {
	static _srcFile = "data/playlists";

	constructor(player, pluginPath) {
		if(!(player instanceof Player))
			throw new Error("Falta el objeto de tipo Player");

		Object.defineProperty(this, "player", { value: player, enumerable: true });
		Object.defineProperty(this, "_pluginPath", { value: pluginPath });
	}

	/**
	 * Obtiene la ruta donde debería encontrarse almacenado
	 * el fichero con los datos de un usuario
	 * 
	 * @param {string} id ID de discord del usuario
	 * @returns Devuelve la ruta
	 */
	getFilePath(id) {
		return path.join(this._pluginPath, this.constructor._srcFile, `user_${id}.json`);
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
	 * @returns objeto de tipo UserPlaylist
	 */
	create(user) {
		if(!(user instanceof User))
			throw new Error("El parámetro debe ser de tipo User");
		return new UserPlaylist(user, this);
	}

	/**
	 * Devuelve un objeto de tipo UserPlaylist en caso
	 * de existir, si no devuelve null
	 * 
	 * @param {User} user Usuario de discord
	 * @returns objeto de tipo UserPlaylist o null
	 */
	get(user) {
		if(!(user instanceof User))
			throw new Error("El parámetro debe ser de tipo User");
		return this.exists(user.id) ? this.create(user) : null;
	}
}