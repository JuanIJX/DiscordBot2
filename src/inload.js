import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export default async function() {
	try {
		const client = this.discordManager.discord;
		const gestorCanales = this.modules.get("Autocanales").gestorCanales;

		const guild = client.guilds.cache.get("772607985104060417");
		const channel = guild.channels.cache.get("1114027592056582195");
		
		//aux_2 = aux_1.list.get("772607985104060417"); // guildCanal
		//member = await aux_2.guild.members.fetch("171058039065935872").then(member => member);
		//user = member.user;
		//await aux_2.createCanal(user);
		//aux_3 = aux_2.list.get("1114027592056582195"); // Canal
		//await aux_3.addBanned("754407873567654048");

		//console.log(aux_3.toJSON());

		//console.log(p);
	} catch (error) {
		console.log("ERROR DE IN LOAD");
		console.log(error);
	}
}