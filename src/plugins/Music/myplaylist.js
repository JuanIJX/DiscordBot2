import fs from "fs";
import path from "path"
import Config from "../../libraries/config.js";
import { getDate } from "../../libraries/utils.mjs";
import { Player, SearchResult, Track, Util } from "./DiscordPlayer.cjs"
import { User } from "discord.js";

export class MyPlaylist {
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

	get size() { return this._tracks.length; }
	get name() { return this._name; }
	get description() { return this._description; }
	get date() { return this._date; }
	get tracks() { return this._tracks; }
	get totalDuration() { return Util.buildTimeCode(Util.parseMS(this.tracks.reduce((a, c) => a + c.durationMS, 0))); }

	setName(name) {
		this._name = name;
	}

	setDescription(description) {
		this._description = description;
	}

	delete() {
		this._parent.remove(this._parent.lists.indexOf(this));
	}

	at(index) {
		return index >= 0 && index < this.size ? this.tracks[index] : null;
	}

	remove(index) {
		if(index >= 0 && index < this.size)
			this.tracks.splice(index, 1);
		return this;
	}

	add(searchResult) {
		if(!(searchResult instanceof SearchResult))
			throw new Error("Se debe introducir un SearchResult");

		for (const track of searchResult.tracks)
			if(!this.tracks.find(tr => tr.url == track.url))
				this.tracks.push(this.constructor._toJSON(track));
		return this;
	}

	async addSearch(cad) {
		this.add(await PlaylistManager.player.search(cad));
	}

	async getTracks() {
		const tracks = [];
		for (const tr of this.tracks)
			tracks.push(await PlaylistManager.player.search(tr.url));
		return tracks;
	}

	addTracksJson(tracksJson) {
		this.tracks.push(...tracksJson);
	}

	toJSON() {
		return {
			name: this.name,
			description: this.description,
			date: this.date,
			tracks: this.tracks
		};
	}

	embed(pag) {
		const pag_size = 10;
		const embed = {
			title: `Mis playlist`,
			fields: this._lists.map((list, i) => {
				return {
					name: `[${(i+1).zeroPad()}] - ${list.name}`,
					value: [
						`Creado el: ${list.date.format("Y-m-d H:i")}`,
						list.description!="" ? `Description: ${list.description}` : null,
						`Tracks: ${list.size}`,
						`Duración: ${list.totalDuration}`,
					].filter(e => e!=null).join("\n")
				};
			})
		};
		if(this.description)
			embed.description = this.description;
		return embed;
	}
}

export class UserPlaylist {
	static _maxlists = 10;

	constructor(user) {
		Object.defineProperty(this, "_id", { value: user.id });
		Object.defineProperty(this, "_tag", { value: user.tag });
		Object.defineProperty(this, "_created", { value: getDate(), writable: true });
		Object.defineProperty(this, "_lists", { value: [] });
		Object.defineProperty(this, "_file", { value: PlaylistManager.getFilePath(this._id) });
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
	get exists() { return false; }

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
					name: `[${(i+1).zeroPad()}] - ${list.name}`,
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
	static player = null;
	static pluginPath = "";
	static _srcFile = "data/playlists";
	static getFilePath = id => path.join(this.pluginPath, this._srcFile, `user_${id}.json`);
	static exists = user => fs.existsSync(this.getFilePath(user.id));

	/**
	 * Devuelve un objeto de tipo UserPlaylist
	 * 
	 * @param {User} user Usuario de discord
	 * @returns objeto de tipo UserPlaylist
	 */
	static create(user) {
		if(!(this.player instanceof Player))
			throw new Error("Falta el objeto de tipo Player");
		if(!(user instanceof User))
			throw new Error("El parámetro debe ser de tipo User");
		return new UserPlaylist(user);
	}

	/**
	 * Devuelve un objeto de tipo UserPlaylist en caso
	 * de existir, si no devuelve null
	 * 
	 * @param {User} user Usuario de discord
	 * @returns objeto de tipo UserPlaylist o null
	 */
	static get(user) {
		if(!(user instanceof User))
			throw new Error("El parámetro debe ser de tipo User");
		return PlaylistManager.exists(user) ? this.create(user) : null;
	}
}