import fs from "fs"
import YAML from "yaml"

export class Config {
	constructor(file, path="") {
		this.path = path;
		this.file = file;
	}

	save() {

	}

	write() {
		
	}
}

export default class ConfigManager {
	constructor() {
		//const file = fs.readFileSync('./src/test/config.yml', 'utf8');
		//const comments = [...file.matchAll(/#.*/g)].map(m => m[0]);
		//const parsedFile = YAML.parse(file);

		
	}
}