import fs from "fs"
import path from "path"
import YAML from "yaml"

function cloneObject(object) {
	return JSON.parse(JSON.stringify(object));
}

export default class Config {
	static permitedExtensions = ["json", "yml"];

	constructor(ruta, defaultData={}) {
		if(ruta === undefined)
			throw new Error("Obligatoria una ruta");
		if(!typeof(defaultData)=="object")
			throw new Error("Se esperaba un objeto como segundo parámetro");

		Object.defineProperty(this, "ext", { value: path.extname(ruta).substring(1) });
		if(!this.constructor.permitedExtensions.includes(this.ext))
			throw new Error("Extensión no permitida");

		Object.defineProperty(this, "_defaultData", { value: cloneObject(defaultData) });
		Object.defineProperty(this, "_filename", { value: path.basename(ruta) });
		Object.defineProperty(this, "_src", { value: path.join(path.dirname(ruta)) });
		Object.defineProperty(this, "_file", { value: path.join(this._src, this._filename) });
		Object.defineProperty(this, "_lastContent", { value: {}, writable: true });

		this._createDirs();
		if(this.exitsFile())
			this._readFile();
		else if(Object.keys(this._defaultData).length > 0)
			this._writeFile(this._defaultData);
	}

	get file() {
		return this._file;
	}

	get content() {
		return this._lastContent;
	}

	exitsFile() {
		return fs.existsSync(this.file);
	}

	reset() {
		this.save(this._defaultData);
	}

	save(data) {
		if(typeof(data) != "object")
			throw new Error("Se esperaba un objeto");
		this._writeFile(data);
	}

	reload() {
		if(this.exitsFile())
			this._readFile();
		return this._lastContent;
	}


	// Private functions

	_createDirs() {
		if(!fs.existsSync(this._src)) {
			var totalpath = ".";
			for(const dir of this._src.split("\\")) {
				totalpath = path.join(totalpath, dir);
				if(!fs.existsSync(totalpath))
					fs.mkdirSync(totalpath);
			}
		}
	}

	_writeFile(data) {
		fs.writeFileSync(this.file, this._objectToString(data));
		this._lastContent = data;
	}

	_readFile() {
		this._lastContent = this._stringToObject(fs.readFileSync(this.file, 'utf8'));
	}

	_stringToObject(data) {
		switch (this.ext) {
			case "json":
				return JSON.parse(data);
			case "yml":
				return YAML.parse(data);
		}
	}

	_objectToString(data) {
		switch (this.ext) {
			case "json":
				return JSON.stringify(data, null, "\t");
			case "yml":
				return YAML.stringify(data);
		}
	}
}