const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Supprime tous les messages du channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const channel = interaction.channel;

    // confirmation rapide
    await interaction.reply({ content: "Suppression en cours...", ephemeral: true });

    let deleted;
    do {
      // supprime max 100 messages à la fois
      deleted = await channel.bulkDelete(100, true).catch(err => {
        console.error(err);
        interaction.followUp({ content: "Erreur lors de la suppression", ephemeral: true });
        return null;
      });
    } while (deleted && deleted.size >= 1);

    interaction.followUp({ content: "Tous les messages supprimés (ou max 14 jours)", ephemeral: true });
  },
};