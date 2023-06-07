import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export default async function() {
	try {
		const client = this.discordManager.discord;
		const gestorCanales = this.modules.get("Autocanales").gestorCanales;

		//const guild = client.guilds.cache.get("772607985104060417");
		//const channel = guild.channels.cache.get("1114027592056582195");
		
		//const guildCanal = gestorCanales.list.get("772607985104060417"); // guildCanal
		//const canal = guildCanal.list.get("1115659179865153576");
	} catch (error) {
		console.log("ERROR DE IN LOAD");
		console.log(error);
	}
}