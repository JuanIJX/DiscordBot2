import fs from "fs"
import path from "path"
import YAML from "yaml"

String.prototype.getExt = function() {
	const pos = this.lastIndexOf(".");
	if(pos!=-1)
		return this.substring(pos+1);
	return this;
};

export default class Config {
	static permitedExtensions = ["js", "yaml"];

	constructor(ruta, defaultData={}) {
		if(ruta === undefined)
			throw new Error("Obligatoria una ruta");
		if(typeof(defaultData)=="object")
			throw new Error("Obligatorio valores default");

		Object.defineProperty(this, "ext", { value: ruta.getExt() });
		if(!this.constructor.permitedExtensions.includes(this.ext))
			throw new Error("Extensión no permitida");

		Object.defineProperty(this, "_defaultData", { value: JSON.parse(JSON.stringify(defaultData)) });
		Object.defineProperty(this, "_filename", { value: path.basename(ruta) });
		Object.defineProperty(this, "_src", { value: path.dirname(ruta) });
		Object.defineProperty(this, "_file", { value: path.join(this._src, this._filename) });
		Object.defineProperty(this, "_lastContent", { value: {}, writable: true });

		if(this.exitsFile())
			this._readFile();
		else if(Object.keys(this._defaultData).length > 0)
			this._writeFile(this._defaultData);
	}

	get file() {
		return this._file;
	}

	get content() {
		if(Object.keys(this._lastContent).length > 0)
			this.reload();
		return this._lastContent;
	}

	exitsFile() {
		return fs.existsSync(this.file);
	}

	reset() {
		this.save(this._defaultData);
	}

	save(data) {

		fs.writeSync()
	}

	reload() {
		if(this.exitsFile()) {
			this._readFile();
			return true;
		}
		return false;
	}


	// Private functions

	_writeFile() {

	}

	_readFile() {
		return this._lastContent = this._stringToObject(fs.readFileSync(this.file, 'utf8'));
	}

	_stringToObject(data) {
		switch (this.ext) {
			case "js":
				return JSON.parse(data);
			case "yaml":
				return YAML.parse(data);
		}
	}

	_objectToString(data) {
		switch (this.ext) {
			case "js":
				return JSON.stringify(data);
			case "yaml":
				return YAML.stringify(data);
		}
	}
}