export default class ConfigManager {
	constructor() {
		Object.defineProperty(this, 'configManager', { value: new ConfigManager(), enumerable: true });

		//const file = fs.readFileSync('./src/test/config.yml', 'utf8');
		//const comments = [...file.matchAll(/#.*/g)].map(m => m[0]);
		//const parsedFile = YAML.parse(file);
	}
}