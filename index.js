process.env.DOTENV_CONFIG_QUIET = 'true';
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const mongoose = require('mongoose');

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		const { cooldowns } = interaction.client;
		if (!cooldowns.has(command.data.name)) {
			cooldowns.set(command.data.name, new Collection());
		}
		const now = Date.now();
		const timestamps = cooldowns.get(command.data.name);
		const defaultCooldownDuration = 5;
		const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1_000;
		if (timestamps.has(interaction.user.id)) {
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1_000);
				return interaction.reply({
					content: `Take time to look at this beauty! \`${command.data.name}\`. Try again in <t:${expiredTimestamp}:R>...`,
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		timestamps.set(interaction.user.id, now);

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.reply({
					content: 'There was an error while executing this command!',
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	} else if (interaction.isButton()) {
		if (interaction.customId === 'rollingu_button') {
			const command = interaction.client.commands.get('rollingu');
			if (command) {
				try {
					await command.execute(interaction);
				} catch (error) {
					console.error(error);
					await interaction.reply({
						content: 'There was an error while rerolling!',
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		}
	}
});

// Respond to specific words in guild messages
client.on(Events.MessageCreate, async (message) => {
	// Only process guild text messages and ignore bots
	if (!message.guild || message.author.bot) return;

	const content = message.content.trim().toLowerCase();
	if (content === 'larry' || content === 'Larry') {
		try {
			const res = await fetch('https://static.wikia.nocookie.net/lore-de-lakaka/images/8/8d/Larry_le_Malicieux.png/revision/latest/scale-to-width-down/712?cb=20250424153025&path-prefix=fr');
			const buffer = Buffer.from(await res.arrayBuffer());
			const file = new AttachmentBuilder(buffer, { name: 'larry.png' });

  			await message.reply({ files: [file] });
		} catch (err) {
			console.error('Failed to reply to message:', err);
		}
	}
	if (content === 'pearto' || content === 'Pearto') {
		try {
			await message.reply({
				content: ':3',
				files: ['https://upload-os-bbs.hoyolab.com/upload/2025/01/26/347074628/910d25952399a466227f0efb3c45ee6a_3187046766951281864.webp?x-oss-process=image%2Fresize%2Cs_1000%2Fauto-orient%2C0%2Finterlace%2C1%2Fformat%2Cwebp%2Fquality%2Cq_70']
			});
		} catch (err) {
			console.error('Failed to reply to message:', err);
		}
	}
	if (content === 'deer' || content === 'Deer') {
		try {
			await message.reply({ 
				content: 'deer',
				files: ['https://i.pinimg.com/736x/a0/40/38/a04038905ca3c2ad20856a8822d90732.jpg']
			});
		} catch (err) {
			console.error('Failed to reply to message:', err);
		}
	}
	if (content === 'nigga' || content === 'Nigga' || content === 'negre' || content === 'nègre' || content === 'Negre' || content === 'Nègre') {
		try {
			const res = await fetch('https://media1.tenor.com/m/0JSQsrbtq6QAAAAd/django-unchained-negre.gif');
			const buffer = Buffer.from(await res.arrayBuffer());
			const file = new AttachmentBuilder(buffer, { name: 'nga.gif' });

  			await message.reply({ files: [file] 
			});
		} catch (err) {
			console.error('Failed to reply to message:', err);
		}
	}
});
if (!token) {
	console.error('No Discord token found. Set DISCORD_TOKEN in .env');
	process.exit(1);
}
(async() => {
	await mongoose.connect(process.env.MONGODB_URI);
	console.log('Connected to MongoDB');
	client.login(token);
})();
