const { SlashCommandBuilder } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteprofile")
    .setDescription("Supprime définitivement le profil d'un utilisateur (Admin seulement)")
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Utilisateur dont supprimer le profil')
        .setRequired(true)
    ),

  async execute(interaction) {
    // check admin
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: "T'as pas la permission pour ça...",
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('target');

    try {
      const result = await UserProfile.deleteOne({ userId: targetUser.id });

      if (result.deletedCount === 0) {
        return interaction.reply({
          content: "T'as pas de profil à supprimer pour cet utilisateur",
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: `Profil de ${targetUser.tag} supprimé avec succès !`,
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "Erreur lors de la suppression du profil",
        ephemeral: true,
      });
    }
  },
};