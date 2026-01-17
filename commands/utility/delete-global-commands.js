require('dotenv').config();
const { REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

const rest = new REST().setToken(token);

(async () => {
	try {
		await rest.put(Routes.applicationCommands(clientId), { body: [] });
		console.log('Deleted all global commands.');
	} catch (error) {
		console.error(error);
	}
})();
