const UserProfile = require('../../schemas/UserProfile');
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('streak')
        .setDescription('Check your current daily streak!'),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            await interaction.reply({
                content: 'This command can only be used in a server.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            let userProfile = await UserProfile.findOne({
                userId: interaction.member.id,
            });

            if (!userProfile) {
                const embed = new EmbedBuilder()
                    .setTitle('Daily Streak')
                    .setDescription("You don't have a profile yet. Start claiming cats to build a streak!")
                    .setColor(0xffcc00);

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            const streak = userProfile.streakCount || 0;
            const lastClaim = userProfile.lastDailyClaim
                ? new Date(userProfile.lastDailyClaim).toLocaleString()
                : 'Never';

            const embed = new EmbedBuilder()
                .setTitle('Daily Streak')
                .setDescription(`Your current streak is **${streak}** day(s) <a:fire:1463554898020012139>.\n Your last claim: ${lastClaim}`)
                .setColor(0xff6600);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.log(`Error handling /streak: ${error}`);
            try {
                await interaction.editReply('An error occurred while fetching your streak.');
            } catch (e) {
                console.log('Failed to send error reply for /streak', e);
            }
        }
    },
};