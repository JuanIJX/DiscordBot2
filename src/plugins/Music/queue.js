import { isInteger } from "../../libraries/utils.mjs";
import { SearchResult, Util } from "./DiscordPlayer.cjs"
export default class Queue {
	constructor(queue, musicController) {
		Object.defineProperty(this, "_musicController", { value: musicController });
		Object.defineProperty(this, "queue", { value: queue, enumerable: true });
	}

	get currentTrack() { return this.queue.currentTrack; }
	get tracks() { return this.queue.tracks; }
    get history() { return this.queue.history; }
    get dispatcher() { return this.queue.dispatcher; }
    get node() { return this.queue.node; }
    get filters() { return this.queue.filters; }
    get deleted() { return this.queue.deleted; }
    get connection() { return this.queue.connection; }
    get estimatedDuration() { return this.queue.estimatedDuration; }
    get durationFormatted() { return this.queue.durationFormatted; }
    get voiceReceiver() { return this.queue.voiceReceiver; }
    get metadata() { return this.queue.metadata; }
	get isPlaying() { return this.queue.isPlaying(); }


	/* Controles */

	addTrack(song) {
		if(song instanceof SearchResult)
			this.queue.addTrack(song.playlist ? song.tracks : song.tracks[0]);
		else if(song instanceof Track || (Array.isArray(song) && song[0] instanceof Track))
			this.queue.addTrack(song);
	}

	async join(channel) {
		if (this.inChannel()) {
			// Moverlo a donde se diga
		}
		else
			await this.queue.connect(channel);
	}

	async play(channel=null) {
		if(this.tracks.size == 0)
			return;

		try {
			// Connect if not connected
			if (!this.inChannel())
				await this.queue.connect(channel);

			// Play
			if (!this.isPlaying)
				await this.queue.node.play();
		} catch (error) {
			if (!this.queue.deleted)
				this.queue.delete();
			throw error;
		}
	}

	clear() {
		this.queue.tracks.clear();
        this.queue.dispatcher?.end();
	}

	async skip(channel=null) {
		/*if (queue.repeatMode === 1) {
			queue.setRepeatMode(0);
			queue.node.skip();
			await wait(500);
			queue.setRepeatMode(1);
		}*/

		//console.log(this.isPlaying);
		
		if(this.isPlaying) {
			this.node.setPaused(false);
			this.queue.node.skip();
		}
		else
			await this.play(channel);
	}

	async replay(trackPosition) {
		const track = this.history.tracks.at(trackPosition);
		if(track) {
			this.node.insert(track, 0);
			if(this.isPlaying)
				this.skip();
			else
				await this.queue.node.play(); // Probar cuando no este conectado en un canal
			return track;
		}
		return null;
	}

	jump(trackPosition) {
		const removed = this.node.remove(this.queue.tracks.at(trackPosition));
        if (!removed) return null;
        this.queue.tracks.store.unshift(removed);
        this.skip();
		return removed;
	}

	removeTrack(trackPosition) {
		return this.queue.removeTrack(trackPosition);
	}

	removePositions(init, end) {
		if(!isInteger(init))
			throw new Error(`El valor de inicio debe ser un entero`);
		if(!isInteger(end))
			throw new Error(`El valor de final debe ser un entero`);
		
		init = parseInt(init);
		end = parseInt(end);
		if(init > end) {
			let aux = init;
			init = end;
			end = aux;
		}

		if(init < 0)
			throw new Error(`El valor de inicio por debajo del mínimo`);
		if(end >= this.tracks.size)
			throw new Error(`El valor de final por encima del máximo`);

		const toRemove = this.queue.tracks.store.filter((_, i) => i >= init && i<=end).map(e => e.title);
		this.queue.tracks.store.splice(init, end - init + 1);
		this.queue.player.events.emit('audioTracksRemove', this.queue, toRemove);
		return toRemove;
	}


	/* Funciones */

	inChannel() {
		return !!this.queue.connection;
	}

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
				this.queue.currentTrack!=null ?
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
						`Tiempo total: ${this.queue.durationFormatted}`,
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

	getQueueInfo() {
		return {
			current: this.getCurrentInfo(),
			tracks: this.getTrackList(),
			history: this.getHistoryList(),
			equalizer: this.queue.filters.equalizer?.getEQ(),
		};
	}

	getCurrentInfo() {
		return this.currentTrack != null ? {
			...this._getTrackInfo(this.currentTrack),
			timestamp: this.node.getTimestamp()
		} : null;
	}

	getTrackList() {
		return this.tracks.data.map(track => this._getTrackInfo(track));
	}

	getHistoryList() {
		return this.history.tracks.data.map(track => this._getTrackInfo(track));
	}

	_getTrackInfo(track) {
		return {
			title: track.title,
			author: track.author,
			url: track.url,
			thumbnail: track.thumbnail,
			duration: track.duration,
			extractor: this._getExtractorIdentifier(track.extractor.identifier),
			requestedBy: track.requestedBy
		};
	}

	_getExtractorIdentifier(identifier) {
		return identifier?.substring(19, identifier.length-9);
	}
}