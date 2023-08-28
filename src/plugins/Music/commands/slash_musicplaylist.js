import { SlashCommandBuilder } from "discord.js";
import { wait } from "../../../libraries/utils.mjs"
export default {
	slash: new SlashCommandBuilder()
		.setName('playlist')
		.setDescription('Comando para playlist de usuario')

		.addSubcommand(subcommand => subcommand
			.setName('test')
			.setDescription('Comando de pruebas solo para el creador del bot')
		)

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

		.addSubcommand(subcommand => subcommand
			.setName('play')
			.setDescription('Pone a reproducir tu lista de reproducción')
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

			.addSubcommand(subcommand => subcommand
				.setName('play')
				.setDescription('Pone una de las canciones a reproducir')
				.addIntegerOption(option => option
					.setName('index')
					.setDescription('ID o índice de la lista de reproducción')
					.setMinValue(1)
					.setRequired(true)
				)
				.addIntegerOption(option => option
					.setName('pos1')
					.setDescription('Posición de la canción para elegir una específica')
					.setMinValue(1)
				)
				.addIntegerOption(option => option
					.setName('pos2')
					.setDescription('Posición de otra canción para elegir varias')
					.setMinValue(1)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('add')
				.setDescription('Añade una canción a la lista de reproducción')
				.addIntegerOption(option => option
					.setName('index')
					.setDescription('ID o índice de la lista de reproducción')
					.setMinValue(1)
					.setRequired(true)
				)
				.addStringOption(option => option
					.setName('song')
					.setDescription('URL o nombre de la canción que quieres añadir')
					.setRequired(true)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('remove')
				.setDescription('Elimina una canción de la lista de reproducción')
				.addIntegerOption(option => option
					.setName('index')
					.setDescription('ID o índice de la lista de reproducción')
					.setMinValue(1)
					.setRequired(true)
				)
				.addIntegerOption(option => option
					.setName('pos1')
					.setDescription('Posición de la canción')
					.setMinValue(1)
					.setRequired(true)
				)
				.addIntegerOption(option => option
					.setName('pos2')
					.setDescription('Posición de otra canción para eliminar varias')
					.setMinValue(1)
				)
			)

			.addSubcommand(subcommand => subcommand
				.setName('clear')
				.setDescription('Vacía la lista de reproducción')
				.addIntegerOption(option => option
					.setName('index')
					.setDescription('ID o índice de la lista de reproducción')
					.setMinValue(1)
					.setRequired(true)
				)
			)
		)
	,		
	async execute(interaction) {
		const { user, member, options: ops } = interaction;
		const channel = member.voice.channel;
		const playlistManager = this.musicController.playlistManager;
		const cmdName = ops.getSubcommandGroup() ?? ops.getSubcommand(false);
		const userPlayList = await playlistManager.get(user)
		const exec = await _exec.bind(this)(interaction, user, member, ops, channel, playlistManager, cmdName, userPlayList);
		await userPlayList?.close();

		return exec;
	}
}

async function _exec(interaction, user, member, ops, channel, playlistManager, cmdName, userPlayList) {
	let myPlaylist = null;
	let queue = null;
	let aux_1, aux_2, aux_3, aux_4;

	switch (cmdName) {
		case "test":
			//await interaction.deferReply();
			if(user.id != "171058039065935872") return;

			await interaction.deferReply({ ephemeral: true });
			await wait(4000);
			//await interaction.followUp({ content: "eeeee", ephemeral: true });
			return;
		case "list":
			if(!userPlayList || userPlayList.size == 0)
				return "No hay listas de reproducción";
			return this.getEmbed(await userPlayList.embed(), true);
		case "create":
			userPlayList ??= await playlistManager.create(user);
			await (await userPlayList
				.create(ops.getString("name")))
				.setDescription(ops.getString("description"));
			await userPlayList.close();
			return `Creada la lista con el nombre: '${ops.getString("name")}'`;
		case "delete":
			if(!userPlayList || userPlayList.size == 0)
				return "No hay listas de reproducción";
			if(ops.getInteger("index") > userPlayList.size)
				return `Index máximo: ${userPlayList.size}`

			myPlaylist = await userPlayList.remove(ops.getInteger("index")-1);
			return `Lista eliminada: ${myPlaylist?.name}`;
		case "pl":
			if(!userPlayList || userPlayList.size == 0)
				return "No hay listas de reproducción";

			switch (ops.getSubcommand(false)) {
				case "list":
					if(ops.getInteger("index") > userPlayList.size)
						return `Index máximo: ${userPlayList.size}`
					myPlaylist = userPlayList.at(ops.getInteger("index") - 1);

					return this.getEmbed(await myPlaylist.embed((ops.getInteger("pag") ?? 1) - 1, 20), true);
				case "add":
					if(ops.getInteger("index") > userPlayList.size)
						return `Index máximo: ${userPlayList.size}`
					myPlaylist = userPlayList.at(ops.getInteger("index")-1);

					aux_2 = await this.musicController.search(ops.getString("song"));
					if (!aux_2.hasTracks())
						return `No se encuentra cancion alguna`;
					aux_1 = await myPlaylist.add(aux_2);

					if(aux_1.length == 0)
						return `No se añadió ninguna canción`;
					if(aux_1.length == 1)
						return `Se añadió la canción '${aux_1[0].title}' a la lista '${myPlaylist.name}'`;
					return `Se añadieron ${aux_1.length} canciones a la lista '${myPlaylist.name}'`;
				case "remove":
					if(ops.getInteger("index") > userPlayList.size)
						return `Index máximo: ${userPlayList.size}`
					myPlaylist = userPlayList.at(ops.getInteger("index")-1);
					aux_1 = ops.getInteger("pos1") - 1;
					aux_2 = (ops.getInteger("pos2") ?? ops.getInteger("pos1")) - 1;
					if(aux_2 < aux_1) {
						let aux = aux_1;
						aux_1 = aux_2;
						aux_2 = aux;
					}

					aux_4 = myPlaylist.size;
					aux_3 = await myPlaylist.remove(aux_1, aux_2 + 1 - aux_1);
					switch (aux_3.length) {
						case 0:
							return `No se eliminó ninguna canción`
						case 1:
							return `Se eliminó la canción [${aux_1+1}] '${aux_3[0].title}'`;
						default:
							return `Se eliminaron del ${aux_1+1} al ${aux_2 < aux_4 ? aux_2+1 : aux_4} canciones (${aux_3.length})`;
					}
				case "play":
					await interaction.deferReply({ ephemeral: true });
					if(ops.getInteger("index") > userPlayList.size)
						return `Index máximo: ${userPlayList.size}`
					myPlaylist = userPlayList.at(ops.getInteger("index")-1);
					
					aux_1 = ops.getInteger("pos1");
					aux_2 = ops.getInteger("pos2");
					if(aux_1 == null) {
						aux_1 = 0;
						aux_2 = myPlaylist.size - 1;
					}
					else if(aux_2 == null) {
						aux_1--;
						aux_2 = aux_1;
					}
					else {
						aux_1--;
						aux_2--;
						if(aux_2 < aux_1) {
							let aux = aux_1;
							aux_1 = aux_2;
							aux_2 = aux;
						}
					}

					if(aux_1 >= myPlaylist.size || aux_2 >= myPlaylist.size)
						return `Posición de la canción máxima: ${myPlaylist.size}`

					aux_3 = await myPlaylist.getTracks(aux_1, aux_2, user);
					queue = this.musicController.createQueue(interaction.guild.id);
					queue.addTrack(aux_3);
					if(queue.isPlaying())
						return `Añadido a la cola`;

					await queue.play(channel);
					await interaction.followUp({ content: `Reproduciendo!`, ephemeral: true });
					return;
				case "clear":
					if(ops.getInteger("index") > userPlayList.size)
						return `Index máximo: ${userPlayList.size}`
					userPlayList.at(ops.getInteger("index") - 1).clear();
					return `Lista vaciada`;
			}
			break;
	}

	await userPlayList.close();

	return "default value de la playlist";
}