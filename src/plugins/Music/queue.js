import { isInteger } from "../../libraries/utils.mjs";
import DiscordPlayer, { Util } from "./DiscordPlayer.cjs"
const { EqualizerConfigurationPreset } = DiscordPlayer
export default class Queue {
	constructor(queue, mc) {
		this.queue = queue;
		this.mc = mc;
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


	/* Controles */

	async addAndPlay(searchResult, channel=null) {
		// Connect if not connected
		if (!this.inChannel()) {
			try {
				await this.queue.connect(channel);
			} catch (error) {
				if (!this.queue.deleted)
					this.queue.delete();
				throw error;
			}
		}

		// Add song
		this.queue.addTrack(searchResult.playlist ? searchResult.tracks : searchResult.tracks[0]);

		// Play
		if (!this.queue.isPlaying()) {
			// @distube/ytdl-core
			await this.queue.node.play();
			return true;
		}
		return false;
	}

	clear() {
		this.queue.tracks.clear();
        this.queue.dispatcher?.end();
	}

	skip() {
		/*if (queue.repeatMode === 1) {
			queue.setRepeatMode(0);
			queue.node.skip();
			await wait(500);
			queue.setRepeatMode(1);
		}*/
		return this.queue.isPlaying() && this.queue.node.skip();
	}

	async replay(trackPosition) {
		const track = this.history.tracks.at(trackPosition);
		if(track) {
			this.node.insert(track, 0);
			if(this.queue.isPlaying())
				this.skip();
			else
				await this.queue.node.play();
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

	embedList(pag=0, pagSize=20) {
		const current = this.getCurrentInfo();
		const tracks = this.getTrackList();
		const pagMax = Math.ceil(tracks.length/pagSize)-1;
		pag = (pag < 0 || pag > pagMax) ? 0 : pag;
		const sl1 = pag*pagSize;
		const sl2 = sl1 + pagSize;

		return {
			title: 'Lista canciones',
			fields: [
				{
					name: "Canción actual:",
					value: this.queue.currentTrack!=null ?
						`[${current.title}](${current.url}) ${current.timestamp.current.label}/${current.duration}` :
						`No hay canción`
				},
				{
					name: `Tracks [${pag+1}/${pagMax+1}]`,
					value: tracks.length > 0 ? tracks.map((track, i) => {
						return `${i+1}. [${track.title}](${track.url}) ${track.duration}`;
					}).slice(sl1, sl2).join("\n") : "No hay canciones",
				},
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
			title: 'Lista canciones',
			fields: [
				{
					name: `Reproduciones pasadas [${pag+1}/${pagMax+1}]`,
					value: tracks.length > 0 ? tracks.map((track, i) => {
						return `${i+1}. [${track.title}](${track.url}) ${track.duration}`;
					}).slice(sl1, sl2).join("\n") : "No hay canciones",
				},
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
		return {
			title: 'Info canción',
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
					name: `Duracion`,
					value: trackInfo.duration,
				}
			]
		};
	}

	tracksLength() {
		return this.queue.tracks.size;
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
			duration: track.duration,
			extractor: this._getExtractorIdentifier(track.extractor.identifier)
		};
	}

	_getExtractorIdentifier(identifier) {
		return identifier?.substring(19, identifier.length-9);
	}
}