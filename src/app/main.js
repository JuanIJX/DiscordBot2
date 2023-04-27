'use strict'

import fs from "fs"
import path from "path";
import 'dotenv/config'
import { Collection } from "discord.js"
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PackageJson = require("../../package.json");

// Personal imports
import { wait } from "../libraries/utils.mjs";
import { createDir } from "./ownfunctions.js";
import Logger, { Level } from "../libraries/logger.js";
import KeyB from "../libraries/KeyB.js"

import defaultConfig from "./settings/defaultconfig.js";
import systemPaths from "./settings/dynamicpaths.js";
import commands from "../commands.js";

import DiscordManager from "./manager/discordmanager.js";
import Module from "./module.js";
import Config from "../libraries/config.js";
import CommandManager from "./manager/commandmanager.js";
import { EOL } from "os";


export default class Main {
	static nombre = PackageJson.name.camelCase("-", false);
	static version = PackageJson.version;

	static instance = null;

	static async init() {
		if(this.instance == null) {
			this.instance = new this();
			try {
				await this.instance.asyncInit();
			}
			catch (error) {
				this.instance.log(Level.FATAL, this.instance._config.debug ? error.stack : error.message);
				this.instance.stop();
			}
		}
		return this.instance;
	}

	constructor() {
		// ** INIT VARS **
		Object.defineProperty(this, '_config', { value: {...defaultConfig} });
		Object.defineProperty(this, '_token', { value: "ODA2NTQ5NzQyODAwMjA3OTIz.G5mqE9.XYkWVMzdpfUi6UCU93Cj82tIW2fJZCpluHv6Q8" });
		Object.defineProperty(this, '_modules', { value: new Collection() });
		Object.defineProperty(this, '_logger', { value: new Logger(systemPaths.logsTotalPath) });
		Object.defineProperty(this, '_discordManager', { value: new DiscordManager(this._logger, this._token) });
		Object.defineProperty(this, '_commandManager', { value: new CommandManager(this._discordManager) });
		Object.defineProperty(this, '_configPlugins', { value: new Config(path.join(systemPaths.basePath, systemPaths.configPath, "plugins.yml")) });


		//  ** FAST SETTINGS **
		Object.assign(this._config, this._readCommandLineArgs());

		this.discordManager.discord.on("messageCreate", m => this._commandManager.commandHandler(m));

		if(this._config.debug)
			this._logger
				.addLevelConsole(Level.DEBUG)
				.addLevelFile(Level.DEBUG);

		this.log(Level.INFO, [
			`--------------------------------------`,
			`\t\t${this.constructor.nombre} ${this.constructor.version}`,
			`--------------------------------------`,
			"",
		]);

		KeyB.onClose(async () => { await this._stop(); });
		KeyB.bucle((...args) => commands(this, ...args));
		this.log(Level.DEBUG, "Iniciado escucha de comandos de consola");
	}

	async asyncInit() {
		//  ** SLOW SETTINGS **

		await this.discordManager.start();
		await this._loadModules();
		await this._startModules();

		this.log(Level.INFO, "Done!");
		//this.log(Level.INFO, "Pero me paro!"); await wait(200); this.stop();
	}

	log(level, msg) { this._logger.log(level, this.name, msg); }
	get name() { return this.constructor.name; }
	get modules() { return this._modules; }
	get discordManager() { return this._discordManager; }
	get commandManager() { return this._commandManager; }

	async stop() {
		await KeyB.stop();
	}

	async _stop() {
		await this._stopModules();
		await this.discordManager.stop();
		this.log(Level.INFO, "FIN!"+EOL);
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

	async _loadModules() {
		this.log(Level.DEBUG, "Cargando módulos...");

		const basePath = systemPaths.basePath;
		const pluginsPath = systemPaths.pluginsPath;
		const mainJS = "index.js";

		createDir(path.join(basePath, pluginsPath)); // create plugin path if no exists

		// Load modules
		for (const folder of fs.readdirSync(path.join(basePath, pluginsPath)).filter(file => fs.existsSync(path.join(basePath, pluginsPath, file, mainJS)) ? true : false)) {
			var classModuleName = null;
			try {
				const ClassModule = (await import(["..", pluginsPath, folder, mainJS].join("/"))).default;
				if(ClassModule === undefined) // Si lo importado no contiene ningún export
					continue;
				classModuleName = ClassModule.name;
				if(classModuleName != folder) // Si el nombre del directorio no coincide con el nombre del plugin
					continue;
				if(this.modules.has(classModuleName)) // Si ya hay un plugin con el mismo nombre
					continue;
				const instanciedModule = new ClassModule();
				if(!(instanciedModule instanceof Module)) // Si no extiende la clase Module
					continue;

				// Cargado con éxito
				await instanciedModule._load(this._logger, this.discordManager, this.commandManager);
				this.modules.set(classModuleName, instanciedModule);
				this._logger.log(Level.DEBUG, this.name, `Plugin '${classModuleName}' cargado`);
			} catch (error) {
				this._logger.log(Level.ERROR, classModuleName ?? this.name, this._config.debug ? error.stack : error.message);
			}
		}

		// Put config
		this.modules.forEach((v, key) => this._configPlugins.content[key] = this._configPlugins.content[key] ?? false);
		this._configPlugins.save(this._configPlugins.content);
		
		this.log(Level.INFO, `Plugins cargados: ${this.modules.size}`);
	}

	async _startModules() {
		for (const [key, value] of this.modules)
			if(this._configPlugins.content[key] === true)
				await value.start();
	}

	async _stopModules() {
		for (const [key, value] of this.modules)
			if(value.started)
				await value.stop();
	}
}


/**
	"@discordjs/voice": "^0.16.0",
    "bufferutil": "^4.0.7",
    "discord.js": "^14.9.0",
    "erlpack": "^0.1.4",
    "fs": "^0.0.1-security",
    "stack-trace": "^1.0.0-pre2",
    "utf-8-validate": "^6.0.3",
    "yaml": "^2.2.1",
    "zlib-sync": "^0.1.8"
 */