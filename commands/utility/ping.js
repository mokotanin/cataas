const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong! and latency info'),
	async execute(interaction) {
		const roundtrip = sent.resource.message.createdTimestamp - interaction.createdTimestamp;
		const websocket = interaction.client.ws.ping;
		const sent = await interaction.reply({ content:`Roundtrip: ${roundtrip}ms\nWebSocket: ${websocket}ms`, ephemeral:true});
	},
};