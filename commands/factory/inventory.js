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

            // Helpers: maintain current index (for picture) and derived page
            let currentIndex = 0;
            const pageSize = 10; // entries per page
            const descriptionLimit = 4000; // stay safely under Discord's 4096 char limit
            const totalPages = Math.max(1, Math.ceil(parsed.length / pageSize));

            const getPage = () => Math.floor(currentIndex / pageSize);
            const clampIndexToPage = (page) => {
                const start = page * pageSize;
                if (start >= parsed.length) {
                    currentIndex = parsed.length - 1;
                } else {
                    currentIndex = start;
                }
            };

            const buildDescription = () => {
                const page = getPage();
                const start = page * pageSize;
                const windowed = parsed.slice(start, start + pageSize).map(({ safeName, safeUrl }, idx) => {
                    const globalIndex = start + idx;
                    if (globalIndex === currentIndex) {
                        const displayed = safeUrl ? `[${safeName}](${safeUrl})` : safeName;
                        return `>> ${displayed}`;
                    }
                    return safeName;
                });

                const description = windowed.join("\n");
                if (description.length <= descriptionLimit) return description;

                // Trim to avoid EmbedBuilder length validation errors
                return `${description.slice(0, descriptionLimit - 3)}...`;
            };

            const buildEmbed = () => {
                const page = getPage();
                const embed = new EmbedBuilder()
                    .setTitle(`Chats de ${interaction.user.username}`)
                    .setDescription(buildDescription())
                    .setColor(0x001a2c)
                    .setFooter({ text: `${page + 1}/${totalPages} · ${currentIndex + 1}/${parsed.length}` });

                const thumb = parsed[currentIndex]?.safeUrl;
                if (thumb) embed.setThumbnail(thumb);
                return embed;
            };

            const buildRow = () =>
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`inv_page_prev_${interaction.user.id}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:left:1463546695764672522>')
                        .setDisabled(totalPages <= 1),
                    new ButtonBuilder()
                        .setCustomId(`inv_prev_${interaction.user.id}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:up:1462032384902828115>')
                        .setDisabled(parsed.length <= 1),
                    new ButtonBuilder()
                        .setCustomId(`inv_next_${interaction.user.id}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:down:1462032396022190081>')
                        .setDisabled(parsed.length <= 1),
                    new ButtonBuilder()
                        .setCustomId(`inv_page_${interaction.user.id}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('<:right:1463546677221789942>')
                        .setDisabled(totalPages <= 1)
                );

            const row = buildRow();

            await interaction.editReply({ embeds: [buildEmbed()], components: [row] });

            // Collector: allow only this user to navigate for 60s
            const collector = interaction.channel.createMessageComponentCollector({
                time: 60_000,
                filter: (i) =>
                    i.user.id === interaction.user.id &&
                    (i.customId === `inv_prev_${interaction.user.id}` ||
                        i.customId === `inv_next_${interaction.user.id}` ||
                            i.customId === `inv_page_prev_${interaction.user.id}` ||
                        i.customId === `inv_page_${interaction.user.id}`),
            });

            collector.on("collect", async (i) => {
                // customId is like `inv_prev_<userId>` or `inv_next_<userId>`
                if (i.customId.includes("prev")) {
                    if (i.customId.includes("page_prev")) {
                        const prevPage = (getPage() - 1 + totalPages) % totalPages;
                        clampIndexToPage(prevPage);
                    } else {
                        currentIndex = (currentIndex - 1 + parsed.length) % parsed.length;
                    }
                } else if (i.customId.includes("next")) {
                    currentIndex = (currentIndex + 1) % parsed.length;
                } else if (i.customId.includes("page")) {
                    const nextPage = (getPage() + 1) % totalPages;
                    clampIndexToPage(nextPage);
                }

                collector.resetTimer();
                await i.update({ embeds: [buildEmbed()], components: [row] });
            });

            collector.on("end", async () => {
                try {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        row.components.map((btn) => ButtonBuilder.from(btn).setDisabled(true))
                    );
                    const message = await interaction.fetchReply();
                    await message.edit({ components: [disabledRow] });
                } catch (err) {
                    // Message was deleted or no longer exists - silently ignore
                    console.log('Could not disable buttons on timeout:', err.message);
                }
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