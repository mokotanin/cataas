const { REST, Routes } = require('discord.js');

async function deleteGlobalCommands() {
	// Load environment only when the function is invoked. Suppress dotenv info logs.
	const _suppressDotenvLogs = () => {
		const noop = () => {};
		const saved = { log: console.log, info: console.info, warn: console.warn };
		console.log = console.info = console.warn = noop;
		try {
			require('dotenv').config();
		} finally {
			console.log = saved.log;
			console.info = saved.info;
			console.warn = saved.warn;
		}
	};
	_suppressDotenvLogs();
	const token = process.env.DISCORD_TOKEN;
	const clientId = process.env.CLIENT_ID;
	const rest = new REST().setToken(token);

	try {
		await rest.put(Routes.applicationCommands(clientId), { body: [] });
		console.log('Deleted all global commands.');
	} catch (error) {
		console.error(error);
	}
}

module.exports = deleteGlobalCommands;

if (require.main === module) {
	// Called directly with `node delete-global-commands.js`
	deleteGlobalCommands();
}