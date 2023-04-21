// 13/04/2023

import fs from 'fs'
import path from "path"
import { EOL } from "os"

export const Level = {
	NONE:   0,

	INFO:	1 << 0,
	TRACE:	1 << 1,
	DEBUG:	1 << 2,
	WARN:	1 << 3,
	ERROR:	1 << 4,
	FATAL:	1 << 5,
	TEST:	1 << 6,
	HIST:	1 << 7,

	ALLERR: 0x38,

	ALL:    0xff,
};

export default class Logger {
	static _extension = "txt";
	static _hourFormat = "H:i:s";
	static _getDate = () => new Date();

    constructor(folder) {
		// Variables
		Object.defineProperty(this, '_dayStr', { value: "", writable: true });
		Object.defineProperty(this, '_file', { value: null, writable: true });
		Object.defineProperty(this, '_folder', { value: folder!==undefined ? path.normalize(folder) : "logs" });
		Object.defineProperty(this, '_levelConsole', { value: (Level.ALL & ~(Level.DEBUG | Level.HIST)), writable: true });
		Object.defineProperty(this, '_levelFile', { value: (Level.ALL & ~Level.DEBUG), writable: true });

		// Functions
		Object.defineProperty(this, "levelConsole", {
			get() { return this._levelConsole; },
			set(level) { this.setLevelConsole(level); },
			enumerable: true
		});
		Object.defineProperty(this, "levelFile", {
			get() { return this._levelFile; },
			set(level) { this.setLevelFile(level); },
			enumerable: true
		});

		Object.defineProperty(this, "_log", { value: function(loglevel, invoker, msg, date, loglevelName) {
			var msg = `${date.format(this.constructor._hourFormat)}` + (invoker=="" ? "" : ` [${invoker}] (${loglevelName})`) + ` ${msg}`;
			if(this.levelConsole & loglevel)
				this._writeConsole(msg);
			if(this.levelFile & loglevel)
				this._writeFile(msg);
		} });
		Object.defineProperty(this, "_writeConsole", { value: function(msg) {
			console.log(msg);
		} });
		Object.defineProperty(this, "_writeFile", { value: function(msg) {
			var file = this._getFile();
			fs.writeSync(this._file, `${msg}${EOL}`);
		} });
		Object.defineProperty(this, "_getFile", { value: function() {
			var today = this.constructor._getDate().format("Y-m-d");
			if(this._dayStr != today) {
				this._dayStr = today;
				this._closeFile();
				this._file = fs.openSync(path.join(this._folder, `log_${this._dayStr}.${this.constructor._extension}`), "a+");
			}
			return this._file;
		} });
		Object.defineProperty(this, "_closeFile", { value: function() {
			if(this._file !== null)
				fs.closeSync(this._file);
		} });

		if(!fs.existsSync(this._folder)) {
			var totalpath = ".";
			for(const dir of this._folder.split("\\")) {
				totalpath = path.join(totalpath, dir);
				if(!fs.existsSync(totalpath))
					fs.mkdirSync(totalpath);
			}
		}
    }

	// Public functions
	addLevelConsole(level) {
		this._levelConsole |= level;
		return this;
	}
	delLevelConsole(level) {
		this._levelConsole &= ~level;
		return this;
	}
	setLevelConsole(level) {
		this._levelConsole = level;
		return this;
	}

	addLevelFile(level) {
		this._levelFile |= level;
		return this;
	}
	delLevelFile(level) {
		this._levelFile &= ~level;
		return this;
	}
	setLevelFile(level) {
		this._levelFile = level;
		return this;
	}

	log(loglevel, invoker, msg) {
		var loglevelName = Level.getKeyByValue(loglevel);
		var date = this.constructor._getDate();

		if(Array.isArray(msg)) {
			for (const value of msg)
				this._log(loglevel, invoker, value, date, loglevelName);
		}
		else // if(typeof msg == "string")
			this._log(loglevel, invoker, msg, date, loglevelName);
	}
}