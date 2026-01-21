const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const UserProfile = require("../../schemas/UserProfile");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteprofile")
    .setDescription("Permanently delete a user's profile (Admin only)")
    .addUserOption(option =>
      option.setName('target')
        .setDescription('User whose profile to delete')
        .setRequired(true)
    ),

  async execute(interaction) {
    // check admin
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: "You don't have permission for that...",
        flags: MessageFlags.Ephemeral,
      });
    }

    const targetUser = interaction.options.getUser('target');

    try {
      const result = await UserProfile.deleteOne({ userId: targetUser.id });

      if (result.deletedCount === 0) {
        return interaction.reply({
          content: "No profile to delete for this user",
          flags: MessageFlags.Ephemeral,
        });
      }

      await interaction.reply({
        content: `Profile of ${targetUser.tag} deleted successfully!`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "Error deleting the profile",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};