import { ApplicationCommandOptionType, ChannelType, SlashCommandBuilder } from "discord.js";
import { isInteger } from "../../../libraries/utils.mjs";
import PlaylistManager from "../myplaylist.js";

export default {
	slash: new SlashCommandBuilder()
		.setName('playlist')
		.setDescription('Comando para playlist de usuario')

		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('Listado de tus listas de reproducción')
		)

		.addSubcommand(subcommand => subcommand
			.setName('create')
			.setDescription('Crea tu lista de reproducción')
			.addStringOption(option => option
				.setName('name')
				.setDescription('Nombre de la lista de reproducción')
				.setMaxLength(40)
				.setRequired(true)
			)
			.addStringOption(option => option
				.setName('description')
				.setMaxLength(200)
				.setDescription('Breve descripción sobre la lista de reproducción')
			)
		)

		.addSubcommand(subcommand => subcommand
			.setName('delete')
			.setDescription('Elimina una de tus listas de reproducción')
			.addIntegerOption(option => option
				.setName('index')
				.setDescription('ID o índice de la lista de reproducción')
				.setMinValue(1)
				.setRequired(true)
			)
		)

		.addSubcommandGroup(group => group
			.setName('pl')
			.setDescription('Controla tu lista de reproducción')

			.addSubcommand(subcommand => subcommand
				.setName('list')
				.setDescription('Muestra información sobre una lista de reproducción concreta')
				.addIntegerOption(option => option
					.setName('index')
					.setDescription('ID o índice de la lista de reproducción')
					.setMinValue(1)
					.setRequired(true)
				)
				.addIntegerOption(option => option
					.setName('pag')
					.setDescription('Número de página para mostrar las canciones')
					.setMinValue(1)
				)
			)
		)
	,		
	async execute(interaction) {
		const user = interaction.user;
		const ops = interaction.options;
		const cmdName = ops.getSubcommandGroup() ?? ops.getSubcommand(false);
		
		let userPlayList = PlaylistManager.get(user);
		let myPlaylist = null;

		switch (cmdName) {
			case "list":
				if(!userPlayList || userPlayList.size == 0)
					return "No hay listas de reproducción";
				return this.getEmbed(userPlayList.embed());
			case "create":
				userPlayList ??= PlaylistManager.create(user);
				userPlayList
					.create(ops.getString("name"))
					.setDescription(ops.getString("description") ?? "")
				userPlayList.save();
				return `Creada la lista con el nombre: '${ops.getString("name")}'`;
			case "delete":
				console.log(ops.getInteger("index"));
				break;
			case "pl":
				switch (ops.getSubcommand(false)) {
					case "list":
						console.log(ops.getInteger("index"));
						console.log(ops.getInteger("pag"));
						break;
				}
				break;
		}

		return "default value de la playlist";
	}
};

async function x(message, cmdName, args, mainCmdname) {
	let
		userPlayList = PlaylistManager.get(message.author),
		myPlaylist,
		aux1,
		aux2;

	switch (args[0]) {
		case "l":
		case "list":
			if(!userPlayList || userPlayList.size == 0)
				await message.reply("No hay listas de reproducción");
			else
				await message.reply(this.getEmbed(userPlayList.embed()));
			break;
		case "create":
			if(args.length <= 1)
				await message.reply("Falta el nombre de la playlist");
			else {
				aux1 = message.content.substr(message.content.indexOf(args[0]) + args[0].length).trim();
				if(aux1.length > 100)
					await message.reply("No puede exceder los 100 caracteres");
				else {
					userPlayList ??= PlaylistManager.create(message.author);
					userPlayList.create(aux1);
					userPlayList.save();
					await message.reply(`Creada la lista con el nombre: '${aux1}'`);
					// Log aki
				}
			}
			break;
		case "remove":
			if(!userPlayList || userPlayList.size == 0)
				await message.reply("No hay listas de reproducción");
			else if(args.length <= 1 || !isInteger(args[1]))
				await message.reply("Falta el número de la lista");
			else {
				aux1 = parseInt(args[1]);
				if(aux1 < 1 || aux1 > userPlayList.size)
					await message.reply(`El índice debe estár entre 1 y ${userPlayList.size}`);
				else {
					
				}
			}
			break;
	}
}

/*

try {
	await command.execute(interaction);
} catch (error) {
	console.error(error);
	if (interaction.replied || interaction.deferred) {
		await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
	} else {
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
}
*/

/*
Acciones a poder realizar por el usuario sobre su conjunto de playlists:
- Crear playlist
 * Con nombre
 * Con nombre y descripción
- Eliminar playlist
- Editar playlist
- Mostrar todas las playlist
- Añadir las canciones de la playlist a la cola
- Añadir una canción de la playlist a la cola

Acciones sobre una playlist concreta:
- Mostrar info
- Añadir canción
- Eliminar canción
*/