import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export default {
	slash: new SlashCommandBuilder()
		.setName('canal')
		.setDescription('Comando de control de canales')
		.setDMPermission(false)

		.addSubcommand(subcommand => subcommand
			.setName('test')
			.setDescription('Comando de pruebas solo para el creador del bot')
		)

		.addSubcommand(subcommand => subcommand
			.setName('regen')
			.setDescription('Activa el Autocanales en este servidor')
			.addStringOption(option => option
				.setName('category')
				.setDescription('Nombre del canal category')
			)
			.addStringOption(option => option
				.setName('text')
				.setDescription('Nombre del canal text')
			)
			.addStringOption(option => option
				.setName('voice')
				.setDescription('Nombre del canal voice')
			)
		)

		.addSubcommand(subcommand => subcommand
			.setName('delete')
			.setDescription('Comando de pruebas solo para el creador del bot')
		)
	,		
	async execute(interaction) {
		const { user, member, guild, channel, options: ops } = interaction;
		const guildCanal = this.gestorCanales.get(guild.id);

		await interaction.deferReply({ ephemeral: true });
		const response = await _execute.bind(this)(interaction, user, member, channel, guild, ops, guildCanal);
		await interaction.followUp({ content: response, ephemeral: true });
	}
}

async function _execute(interaction, user, member, channel, guild, ops, guildCanal) {
	const cmdName = ops.getSubcommandGroup() ?? ops.getSubcommand(false);

	switch (cmdName) {
		case "test":
			if(user.id != "171058039065935872") return;

			//guildCanal?.close();

			return `test`;
		case "regen":
			//PermissionFlagsBits.ManageChannels
			if (!member.permissions.has(PermissionFlagsBits.ManageChannels))
				return `No tienes permisos`;
			if(guildCanal != null)
				return `Ya hay creado`;

			await this.gestorCanales.create(guild, {
				category: ops.getString("category"),
				text: ops.getString("text"),
				voice: ops.getString("voice"),
			});
			return `Canales creados!`;
		case "delete":
			if (!member.permissions.has(PermissionFlagsBits.ManageChannels))
				return `No tienes permisos`;
			if(guildCanal == null)
				return `El servidor no tiene asignado ningún Autocanal`;
			await guildCanal.delete();
			return `Canales eliminados`;
	}

	return `Fin execute`;
}