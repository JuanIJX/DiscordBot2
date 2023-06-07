import { joinVoiceChannel } from "@discordjs/voice";
import { GuildQueue, GuildQueueEvent, SearchResult, Track, Util } from "./DiscordPlayer.cjs"

export default class Queue extends GuildQueue {
	static _getExtractorIdentifier(identifier) {
		return identifier.substring(19, identifier.length-9);
	}

	constructor(musicController, options) {
		super(musicController.player, options);

		this.timeAutoOff = options.timeAutoOff ?? 0;
		Object.defineProperty(this, "_timer", { value: { _destroyed: true }, writable: true });
		Object.defineProperty(this, "_musicController", { value: musicController });

		if(this.timeAutoOff > 0) {
			this.player.events.on(GuildQueueEvent.playerStart, queue => queue.clearTimer());
			this.player.events.on(GuildQueueEvent.playerFinish, queue => queue.startTimer());
			this.player.events.on(GuildQueueEvent.disconnect, queue => queue.clearTimer());
		}
	}

	// Funciones de control de musica

	/**
	 * @override
	 * 
	 * @param {SearchResult | Track | Track[]} song 
	 */
	addTrack(song) {
		if(song instanceof SearchResult)
			super.addTrack(song.playlist ? song.tracks : song.tracks[0]); // Comprobar esta mierda de if ternario porke no creo k haga falta
		else if(song instanceof Track || (Array.isArray(song) && song[0] instanceof Track))
			super.addTrack(song);
	}

	async join(channel) {
		if (this.inChannel())
			await channel.guild.members.me.voice.setChannel(channel)
		else
			await this.connect(channel);
	}

	/**
	 * @overide
	 */
	clear() {
		this.tracks.clear();
        this.dispatcher?.end();
	}

	async play(channel=null) {
		try {
			if(this.isEmpty())
				return;
			if (!this.inChannel())
				await this.connect(channel);
			if (!this.isPlaying())
				await this.node.play();
		} catch (error) {
			if (!this.deleted)
				this.delete();
			throw error;
		}
	}

	async skip(channel=null) {
		/*if (queue.repeatMode === 1) {
			queue.setRepeatMode(0);
			queue.node.skip();
			await wait(500);
			queue.setRepeatMode(1);
		}*/
		
		if(this.isPlaying()) {
			this.node.setPaused(false);
			this.node.skip();
		}
		else
			await this.play(channel);
	}

	async replay(trackPosition) {
		const track = this.history.tracks.at(trackPosition);
		if(track) {
			//this.node.insert(track, 0); // Inserta al principio
			this.addTrack(track); // Inserta al final

			if(!this.isPlaying() && this.inChannel())
				await this.node.play();
			return track;
		}
		return null;
	}

	async jump(trackPosition) {
		const removed = this.node.remove(this.tracks.at(trackPosition));
        if (!removed) return null;
        this.tracks.store.unshift(removed);
        await this.skip();
		return removed;
	}

	removeTrack(trackPosition) {
		return this.removeTrack(trackPosition);
	}

	removePositions(init, end) {
		init = parseInt(init);
		end = parseInt(end);
		if(init > end) {
			let aux = init;
			init = end;
			end = aux;
		}

		if(init < 0) throw new Error(`El valor de inicio por debajo del mínimo`);
		if(end >= this.tracks.size) throw new Error(`El valor de final por encima del máximo`);

		const toRemove = this.tracks.store.filter((_, i) => i >= init && i<=end).map(e => e.title);
		this.tracks.store.splice(init, end - init + 1);
		this.player.events.emit('audioTracksRemove', this, toRemove);
		return toRemove;
	}

	// @override
	delete() {
		super.delete();
		this.clearTimer();
	}

	// Timer de auto-off
	startTimer() { if(!this.timerOn()) this._timer = setTimeout(this.delete.bind(this), this.timeAutoOff * 1000) }
	clearTimer() { if(this.timerOn()) clearTimeout(this._timer); }
	timerOn() { return this._timer._destroyed === false; }


	// Funciones
	inChannel() { return !!this.connection; }

	getQueueInfo() {
		return {
			current: this.getCurrentInfo(),
			tracks: this.getTrackList(),
			history: this.getHistoryList(),
			equalizer: this.filters.equalizer?.getEQ(),
		};
	}
	getCurrentInfo() {
		return this.currentTrack != null ? {
			...this._getTrackInfo(this.currentTrack),
			timestamp: this.node.getTimestamp()
		} : null;
	}

	getTrackList() { return this.tracks.data.map(track => this._getTrackInfo(track)); }
	getHistoryList() { return this.history.tracks.data.map(track => this._getTrackInfo(track)); }

	_getTrackInfo(track) {
		return {
			title: track.title,
			author: track.author,
			url: track.url,
			thumbnail: track.thumbnail,
			duration: track.duration,
			extractor: track.extractor.identifier ? Queue._getExtractorIdentifier(track.extractor.identifier) : null,
			requestedBy: track.requestedBy
		};
	}


	// Embeds
	embedList(pag=0, pagSize=10) {
		const current = this.getCurrentInfo();
		const tracks = this.getTrackList();
		const pagMax = Math.ceil(tracks.length/pagSize)-1;
		pag = (pag < 0 || pag > pagMax) ? 0 : pag;
		const sl1 = pag*pagSize;
		const sl2 = sl1 + pagSize;

		return {
			title: 'Lista canciones',
			description: [
				`**Canción actual**${this.node.isPaused() ? ` [Pausa]` : ""}`,
				this.currentTrack!=null ?
					`[${current.title}](${current.url}) ${current.timestamp.current.label}/${current.duration}` :
					`No hay canción`,
				``,
				`**Tracks [${pagMax == -1 ? 0 : pag+1}/${pagMax+1}]**`,
				tracks.length > 0 ?
					tracks
						.slice(sl1, sl2)
						.map((track, i) => `**${sl1+i+1}.** [${track.title.suspensivos(64)}](${track.url}) ${track.duration}`)
						.join("\n") :
					"No hay canciones"
			].join("\n").suspensivos(4096, "#!#"),
			fields: [
				{
					name: "Estadísticas",
					value: [
						`Cantidad canciones: ${tracks.length}`,
						`Tiempo total: ${this.durationFormatted}`,
					].join("\n")
				},
			]
		};
	}

	embedHistory(pag=0, pagSize=20) {
		const tracks = this.getHistoryList();
		const pagMax = Math.ceil(tracks.length/pagSize)-1;
		pag = (pag < 0 || pag > pagMax) ? 0 : pag;
		const sl1 = pag*pagSize;
		const sl2 = sl1 + pagSize;

		return {
			title: 'Historial de canciones',
			description: [
				`**Reproduciones pasadas [${pagMax == -1 ? 0 : pag+1}/${pagMax+1}]**`,
				tracks.length > 0 ?
					tracks
						.slice(sl1, sl2)
						.map((track, i) => `${sl1+i+1}. [${track.title.suspensivos(64)}](${track.url}) ${track.duration}`)
						.join("\n")  :
					"No hay canciones"
			].join("\n").suspensivos(4096, "#!#"),
			fields: [
				{
					name: "Estadísticas",
					value: [
						`Cantidad canciones: ${tracks.length}`,
						`Tiempo total: ${Util.buildTimeCode(Util.parseMS(this.history.tracks.store.reduce((a, c) => a + c.durationMS, 0)))}`,
					].join("\n")
				},
			]
		};
	}

	embedInfo(pos) {
		const track = pos == 0 ? this.currentTrack : this.tracks.data[pos-1];
		const trackInfo = this._getTrackInfo(track);
		const embed = {
			title: 'Info canción',
			thumbnail: { url: trackInfo.thumbnail }, // No se ha comprobado que pasa si no hay thumbail o si es posible que no haya
			fields: [
				{
					name: `Título`,
					value: trackInfo.title,
				},
				{
					name: `Autor`,
					value: trackInfo.author,
				},
				{
					name: `URL`,
					value: trackInfo.url,
				},
				{
					name: `Duración`,
					value: trackInfo.duration,
				}
			]
		};
		if(trackInfo.requestedBy) {
			embed.fields.push({
				name: `Subido por`,
				value: `${trackInfo.requestedBy.tag} (${trackInfo.requestedBy.id})`,
			});
		}
		return embed;
	}
}