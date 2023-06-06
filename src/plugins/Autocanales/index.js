import { Events } from "discord.js";
import Module from "../../app/module.js";
import slashCmd from "./commands/slash_cmd.js"
import GestorCanales from "./Canal.js";

export default class Autocanales extends Module {
	async onLoad() {
		this.gestorCanales = new GestorCanales(this);
		this.registerEvent(Events.VoiceStateUpdate, this.gestorCanales.voiceStateUpdate.bind(this.gestorCanales));
		this.registerEvent(Events.MessageReactionAdd, this.gestorCanales.messageReactionAdd.bind(this.gestorCanales));
		this.registerEvent(Events.ChannelDelete, this.gestorCanales.channelDelete.bind(this.gestorCanales));
		this.registerEvent(Events.ChannelUpdate, this.gestorCanales.channelUpdate.bind(this.gestorCanales));
		this.registerEvent(Events.GuildMemberRemove, this.gestorCanales.guildMemberRemove.bind(this.gestorCanales));
		this.registerEvent(Events.GuildDelete, this.gestorCanales.guildDelete.bind(this.gestorCanales));
		await this.registerSlash(slashCmd);
	}
	async onEnable() {
		await this.gestorCanales.load();
	}
	async onDisable() {
		await this.gestorCanales.unLoad();
	}
}