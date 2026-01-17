const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong! and latency info'),
	async execute(interaction) {
		const sent = await interaction.reply({ content: 'Pinging...', withResponse: true });
		const roundtrip = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
		const websocket = interaction.client.ws.ping;
		
		await interaction.editReply(`Roundtrip: ${roundtrip}ms\nWebSocket: ${websocket}ms`);
	},
};