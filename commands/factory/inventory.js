const UserProfile = require("../../schemas/UserProfile");
const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Affiche ton inventaire de chats"),

    async execute(interaction) {
        try {
            // Defer reply to avoid "Unknown interaction" when processing takes >3s
            await interaction.deferReply();

            const userId = interaction.user.id;
            const userProfile = await UserProfile.findOne({ userId });

            if (!userProfile || !userProfile.inventory || userProfile.inventory.length === 0) {
                await interaction.editReply({ content: "Ton inventaire est vide.", components: [] });
                return;
            }

            // Parse stored entries "Prenom : URL" into usable pieces
            const parsed = userProfile.inventory.map((entry, idx) => {
                const [name, url] = entry.split(" : ");
                const safeName = name?.trim() || `Chat ${idx + 1}`;
                const safeUrl = url?.trim() || "";
                return { safeName, safeUrl };
            });

            // Helpers: maintain current index, build list text and embed
            let current = 0;
            const maxShown = 25; // cap description length

            const buildDescription = () => {
                const windowed = parsed.slice(0, maxShown).map(({ safeName, safeUrl }, idx) => {
                    const label = safeName;
                    const displayed = safeUrl ? `[${label}](${safeUrl})` : label;
                    return idx === current ? `>> ${displayed}` : displayed;
                });
                const overflow = parsed.length - windowed.length;
                if (overflow > 0) {
                    windowed.push(`+${overflow} chats non affichés`);
                }
                return windowed.join("\n");
            };

            const buildEmbed = () => {
                const embed = new EmbedBuilder()
                    .setTitle(`Chats de ${interaction.user.username}`)
                    .setDescription(buildDescription())
                    .setColor(0x001a2c)
                    .setFooter({ text: `${current + 1}/${parsed.length}` });

                const thumb = parsed[current]?.safeUrl;
                if (thumb) embed.setThumbnail(thumb);
                return embed;
            };

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`inv_prev_${interaction.user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:up:1462032384902828115>'),
                new ButtonBuilder()
                    .setCustomId(`inv_next_${interaction.user.id}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:down:1462032396022190081>')
            );

            await interaction.editReply({ embeds: [buildEmbed()], components: [row] });

            // Collector: allow only this user to navigate for 60s
            const collector = interaction.channel.createMessageComponentCollector({
                time: 60_000,
                filter: (i) =>
                    i.user.id === interaction.user.id &&
                    (i.customId === `inv_prev_${interaction.user.id}` ||
                        i.customId === `inv_next_${interaction.user.id}`),
            });

            collector.on("collect", async (i) => {
                // customId is like `inv_prev_<userId>` or `inv_next_<userId>`
                // endsWith("prev") fails because the id ends with the user id.
                if (i.customId.includes("prev")) {
                    current = (current - 1 + parsed.length) % parsed.length;
                } else {
                    current = (current + 1) % parsed.length;
                }

                await i.update({ embeds: [buildEmbed()], components: [row] });
            });

            collector.on("end", async () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map((btn) => ButtonBuilder.from(btn).setDisabled(true))
                );
                const message = await interaction.fetchReply();
                await message.edit({ components: [disabledRow] });
            });
        } catch (error) {
            console.error(error);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: "Erreur lors de la récupération de l'inventaire.", ephemeral: true });
                } else {
                    await interaction.reply({ content: "Erreur lors de la récupération de l'inventaire.", ephemeral: true });
                }
            } catch (err) {
                console.error('Failed to send inventory error response:', err);
            }
        }
    },
};