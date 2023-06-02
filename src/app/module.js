import url from "url"
import path from "path"
import { get as stackTraceGet } from "stack-trace"
import { Level } from "../libraries/logger.js";
import ConfigManager from "./manager/configmanager.js"
export default class Module {
	constructor(main) {
		// Variables
		Object.defineProperty(this, "_main", { value: main });
		Object.defineProperty(this, '_logger', { value: this._main.logger });
		Object.defineProperty(this, "_path", { value: path.relative(
			process.cwd(),
			url.fileURLToPath(
				path.dirname(
					stackTraceGet()
						.find(callSite => callSite.getFunctionName() === this.constructor.name)
						.getFileName()
				)
			)
		) });
		Object.defineProperty(this, '_started', { value: false, writable: true });
		Object.defineProperty(this, 'color', { value: 0xffffff, writable: true, enumerable: true });
	}

	log(level, msg) { this._logger.log(level, this.name, msg); }
	get thisPath() { return this._path; }
	get name() { return this.constructor.name; }
	get started() { return this._started === true; }
	get _defaultEmbed() {
		return {
			color: this.color,
			author: {
				name: this.discordManager.discord.user.tag,
				icon_url: this.discordManager.discord.user.displayAvatarURL(),
			},
			timestamp: new Date().toISOString(),
			footer: {
				text: "© IJX",
				icon_url: "https://ideaschungas.com/uuuu.png",
			}
		};
	}

	async _load() {
		if(this._loaded === true)
			return;
		Object.defineProperty(this, '_loaded', { value: true });
		Object.defineProperty(this, '_commandManager', { value: this._main.commandManager });
		Object.defineProperty(this, '_slashManager', { value: this._main.slashManager });
		Object.defineProperty(this, '_eventManager', { value: this._main.eventManager, enumerable: true });
		Object.defineProperty(this, 'discordManager', { value: this._main.discordManager, enumerable: true });
		Object.defineProperty(this, 'configManager', { value: new ConfigManager(this._path), enumerable: true });

		await this.onLoad();
	}
	
	async start() {
		if(!this._started) {
			this._commandManager.enableModule(this.name);
			this._slashManager.enableModule(this.name);
			this._eventManager.enableModule(this.name);
			await this.onEnable();
			this.log(Level.INFO, `Plugin '${this.name}' iniciado`);
			this._started = true;
		}
	}
	async stop() {
		if(this._started) {
			this._commandManager.disableModule(this.name);
			this._slashManager.disableModule(this.name);
			this._eventManager.disableModule(this.name);
			await this.onDisable();
			this.log(Level.INFO, `Plugin '${this.name}' detenido`);
			this._started = false;
		}
	}

	async onLoad() {}
	async onEnable() {}
	async onDisable() {}

	// Commands
	registerCommand(name, action) {
		this._commandManager.addCommand(name, this, action);
	}

	// Slash commands
	async registerSlash(data) {
		if(!data.hasOwnProperty("slash"))
			throw new Error("Falta la propiedad slash");
		if(!data.hasOwnProperty("execute"))
			throw new Error("Falta la propiedad execute");
		await this._slashManager.addCommand(this, data.slash, data.execute);
	}

	// Events
	registerEvent(eventName, action) {
		this._eventManager.register(this, eventName, action);
	}


	// Funciones
	getEmbed(objs, ephemeral=false) {
		return { embeds: (Array.isArray(objs) ? objs : [objs]).map(obj => obj.assign(this._defaultEmbed)), ephemeral }
	}

	isAdmin(id) {
		return this._main._admins.includes(id);
	}
}