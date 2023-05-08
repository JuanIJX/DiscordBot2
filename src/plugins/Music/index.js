import Module from "../../app/module.js"
import MusicController from "./music-controller.js";
import funcMusic from "./commands/cmd_music.js"
import funcMusicPlaylist from "./commands/slash_musicplaylist.js"
import { ChannelType, SlashCommandBuilder } from "discord.js";
export default class Music extends Module {
	async onLoad() {
		this.color = 0xbb00ff;
		this.configManager.add("queue", "config/queue.yml", {
			selfDeaf: false,
			leaveOnEmpty: false,
			leaveOnEnd: false,
			leaveOnEmptyCooldown: 30000,
			leaveOnEndCooldown: 30000,
			leaveOnStop: false,
        	leaveOnStopCooldown: 30000,
			volume: 100,
		});
		this.mc = new MusicController(this, this.configManager.get("queue"));
		await this.mc.load();

		this.registerCommand("!Pu", funcMusic);
		this.registerCommand("!pu", funcMusic);

		/*(await slashManager.addCommand(
			null,
			new SlashCommandBuilder()
				.setName('gif')
				.setDescription('Sends a random gif 2!')
				.addStringOption(option =>
					option.setName('category')
						.setDescription('The gif category')
						.setRequired(true)
						.addChoices(
							{ name: 'Funny', value: 'gif_funny' },
							{ name: 'Meme', value: 'gif_meme' },
							{ name: 'Movie', value: 'gif_movie' },
						))
				.addUserOption(option =>
					option.setName('user')
						.setDescription('useroption')),
			function(interaction) {
				console.log(interaction.options.getUser("user"));
				console.log(interaction.options.get("user"));

				console.log(ApplicationCommandOptionType);

				return "hoooo";
			}
		)).enable();*/
	}
	async onEnable() {}
	async onDisable() {
		await this.mc.destroy();
	}
}

const cmds = [
	new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Obtener el ping del bot 2'),
	new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Obtener el ping del bot 2'),
	new SlashCommandBuilder()
		.setName('echo')
		.setDescription('Replies with your input!')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('The input to echo back'))
		.addBooleanOption(option =>
			option.setName('ephemeral')
				.setDescription('Whether or not the echo should be ephemeral')),
	new SlashCommandBuilder()
		.setName('gif')
		.setDescription('Sends a random gif!')
		.addStringOption(option =>
			option.setName('category')
				.setDescription('The gif category')
				.setRequired(true)
				.addChoices(
					{ name: 'Funny', value: 'gif_funny' },
					{ name: 'Meme', value: 'gif_meme' },
					{ name: 'Movie', value: 'gif_movie' },
				)),
	new SlashCommandBuilder()
		.setName('echo2')
		.setDescription('Replies with your input!')
		.addUserOption(option =>
			option.setName("user")
				.setDescription("Descripcion del nombre"))
		.addStringOption(option =>
			option.setName('input')
				.setDescription('The input to echo back')
				// Ensure the text will fit in an embed description, if the user chooses that option
				.setMaxLength(2000))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to echo into')
				// Ensure the user can only select a TextChannel for output
				.addChannelTypes(ChannelType.GuildText))
		.addBooleanOption(option =>
			option.setName('embed')
				.setDescription('Whether or not the echo should be embedded')),
	new SlashCommandBuilder()
		.setName('info')
		.setDescription('Get info about a user or a server!')
		.addSubcommand(subcommand =>
			subcommand
				.setName('user')
				.setDescription('Info about a user')
				.addUserOption(option => option.setName('target').setDescription('The user')))
		.addSubcommand(subcommand =>
			subcommand
				.setName('server')
				.setDescription('Info about the server'))
];