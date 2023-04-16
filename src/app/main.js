'use strict'

import fs from "fs"
import path from "path";
import YAML from 'yaml'
import { Collection } from "discord.js"
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PackageJson = require("../../package.json");

import Logger, { Level } from "../libraries/logger.js";
import KeyB from "../libraries/KeyB.js"
import defaultConfig from "./settings/defaultconfig.js";
import commands from "../commands.js";
import DiscordManager from "./discordmanager.js";
import { wait } from "../libraries/utils.mjs";
import Module from "./module.js";

export default class Main {
	static nombre = PackageJson.name.camelCase("-", false);
	static version = PackageJson.version;
	static instance = null;

	static header() {
		return [
			`--------------------------------------`,
			`\t\t${this.nombre} ${this.version}`,
			`--------------------------------------`,
			"",
		];
	}

	static async init() {
		if(this.instance == null) {
			this.instance = new this();

			try {
				//  ** SLOW SETTINGS **
				//await this.instance.discordManager.start();

				await this.instance.loadModules();






				this.instance.log(Level.INFO, "Done!");

				this.instance.log(Level.INFO, "Pero me paro!");
				await wait(200);
				this.stop();
			} catch (error) {
				this.instance.log(Level.FATAL, error.message);
				this.instance.log(Level.DEBUG, error.stack);
				this.stop();
			}
		}
	}

	static async stop() {
		await this.instance?.stop();
	}

	constructor() {
		// ** INIT VARS **
		Object.defineProperty(this, '_config', { value: {...defaultConfig} });
		Object.defineProperty(this, '_token', { value: "ODA2NTQ5NzQyODAwMjA3OTIz.YBrD-w.yjkES1scvE2cTvUlUTef4gpcoaI" });
		Object.defineProperty(this, '_modules', { value: new Collection() });
		Object.defineProperty(this, '_logger', { value: new Logger() });
		Object.defineProperty(this, '_discordManager', { value: new DiscordManager(this._logger, this._token) });


		//  ** FAST SETTINGS **
		Object.assign(this._config, this._readCommandLineArgs());

		if(this._config.debug)
			this._logger
				.addLevelConsole(Level.DEBUG)
				.addLevelFile(Level.DEBUG);

		this.log(Level.INFO, this.constructor.header());

		KeyB.onClose(async () => { await this._stop(); });
		KeyB.bucle((...args) => commands(this, ...args));
		this.log(Level.DEBUG, "Iniciado escucha de comandos de consola");
	}

	log(level, msg) { this._logger.log(level, this.name, msg); }
	get name() { return this.constructor.name; }
	get modules() { return this._modules; }
	get discordManager() { return this._discordManager; }

	async stop() {
		await KeyB.stop();
	}

	async _stop() {
		this.discordManager.stop();
		this.log(Level.INFO, "FIN!");
	}

	_readCommandLineArgs() {
		const config = {};
		const args = [...process.argv.slice(2)];
		while(args.length > 0) {
			switch(args[0]) {
				case "-debug":
					config.debug = true;
					break;
			}
			args.shift();
		}
		return config;
	}

	async loadModules() {
		this.log(Level.DEBUG, "Cargando módulos...");

		const basePath = "src";
		const pluginsPath = "plugins";
		const mainJS = "index.js";
		const files = fs.readdirSync(path.join(basePath, pluginsPath)).filter(file => fs.existsSync(path.join(basePath, pluginsPath, file, mainJS)) ? true : false);

		for (const folder of files) {
			try {
				const ClassModule = (await import(["..", pluginsPath, folder, mainJS].join("/"))).default;
				if(ClassModule === undefined) // Si lo importado no contiene ningún export
					continue;
				if(ClassModule.name != folder) // Si el nombre del directorio no coincide con el nombre del plugin
					continue;
				if(this.modules.has(ClassModule.name)) // Si ya hay un plugin con el mismo nombre
					continue;
				const instanciedModule = new ClassModule(this._logger, this.discordManager);
				if(!(instanciedModule instanceof Module)) // Si no extiende la clase Module
					continue;

				// Cargado con éxito
				this.modules.set(ClassModule.name, instanciedModule);
				this.log(Level.DEBUG, `Plugin '${ClassModule.name}' cargado`);
			} catch (error) {
				this.log(Level.ERROR, error.message);
				this.log(Level.DEBUG, error.stack);
			}
		}
		this.log(Level.INFO, `Plugins cargados: ${this.modules.size}`);
	}
}