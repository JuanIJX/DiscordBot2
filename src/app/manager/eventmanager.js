import { Collection, Events } from "discord.js";
import Module from "../module.js";

export default class EventManager {
	constructor(logger, discordManager) {
		Object.defineProperty(this, '_logger', { value: logger });
		Object.defineProperty(this, '_discordManager', { value: discordManager });

		Object.defineProperty(this, '_eventList', { value: new Collection() });
	}

	register(module, eventName, action) {
		if(!(module instanceof Module))
			throw new Error(`El primer parámetro debe ser un módulo`);
		if(!Object.values(Events).includes(eventName))
			throw new Error(`El segundo parámetro debe ser un nombre de evento válido`);
		if(typeof action != "function")
			throw new Error(`El tercer parámetro debe ser una función`);

		if(!this._eventList.has(module.name))
			this._eventList.set(module.name, []);

		this._eventList.get(module.name).push({ name: eventName, action });
	}

	unRegister(module) {
		if(this._eventList.has(module.name)) {
			this.disableModule(module.name);
			this._eventList.set(module.name, []);
		}
	}

	// Enable / disable
	enableModule(moduleName) {
		if(this._eventList.has(moduleName))
			for (const event of this._eventList.get(moduleName))
				this._discordManager.discord.on(event.name, event.action);
	}
	disableModule(moduleName) {
		if(this._eventList.has(moduleName))
			for (const event of this._eventList.get(moduleName))
				this._discordManager.discord.off(event.name, event.action);
	}
	disableAll() {
		for (const [_, moduleEvent] of this.modules)
			for (const event of moduleEvent)
				this._discordManager.discord.off(event.name, event.action);
	}
}