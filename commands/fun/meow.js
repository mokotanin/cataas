const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('meowy').setDescription('Replies with Meow!'),
	async execute(interaction) {
		await interaction.reply('Meow!');
	},
};