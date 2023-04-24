import { isInteger } from "../../libraries/utils.mjs";
import DiscordPlayer from "./DiscordPlayer.cjs"
const { EqualizerConfigurationPreset } = DiscordPlayer
export default class Queue {
	constructor(queue, mc) {
		this.queue = queue;
		this.mc = mc;
	}

	get currentTrack() {
		return this.queue.currentTrack;
	}


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
			await this.queue.node.play();
			return true;
		}
		return false;
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

	jump(trackPosition) {
		if(trackPosition > 0)
			this.queue.moveTrack(trackPosition, 0);
		this.skip();
	}

	remove(trackPosition) {
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
		if(end >= this.tracksLength())
			throw new Error(`El valor de final por encima del máximo`);

		end -= init - 1;
		for (let i = 0; i < end; i++)
			this.remove(init);
			//console.log(`${init+i} ${this.remove(init).title}`);
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
			color: 0x00ff40,
			title: 'Lista canciones',
			fields: [
				{
					name: "Canción actual:",
					value: this.queue.currentTrack!=null ?
						`[${current.title}](${current.url}) ${current.timestamp.current.label}/${current.duration}` :
						`No hay canción`
				},
				{
					name: `Tracks (${tracks.length}) [${pag+1}/${pagMax+1}]`,
					value: tracks.length > 0 ? tracks.map((track, i) => {
						return `${i+1}. [${track.title}](${track.url}) ${track.duration}`;
					}).slice(sl1, sl2).join("\n") : "No hay canciones",
				},
			]
		};
	}

	tracksLength() {
		return this.queue.tracks.data.length;
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
		return this.queue.currentTrack != null ? {
			...this._getTrackInfo(this.queue.currentTrack),
			timestamp: this.queue.node.getTimestamp()
		} : null;
	}

	getTrackList() {
		return this.queue.tracks.data.map(track => this._getTrackInfo(track));
	}

	getHistoryList() {
		return this.queue.history.tracks.data.map(track => this._getTrackInfo(track));
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
		return identifier.substring(19, identifier.length-9);
	}
}