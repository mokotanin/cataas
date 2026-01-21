const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete all messages in the channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const channel = interaction.channel;

    // quick confirmation
    await interaction.reply({ content: "Deletion in progress...", flags: MessageFlags.Ephemeral });

    let deleted;
    do {
      // supprime max 100 messages à la fois
      deleted = await channel.bulkDelete(100, true).catch(err => {
        console.error(err);
        interaction.followUp({ content: "Error during deletion", flags: MessageFlags.Ephemeral });
        return null;
      });
    } while (deleted && deleted.size >= 1);

    interaction.followUp({ content: "All messages deleted (or max 14 days)", flags: MessageFlags.Ephemeral });
  },
};