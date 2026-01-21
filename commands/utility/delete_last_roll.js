const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const UserProfile = require('../../schemas/UserProfile');

// Helper: GMT+1 date string to keep consistency with rollingu
const toGMT1DateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const gmt1 = new Date(d.getTime() + 3600 * 1000);
  return gmt1.toISOString().split('T')[0];
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-last-roll')
    .setDescription('Deletes the most recent roll entry for you or a target user')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User whose last roll will be removed (admin only)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const isSelf = targetUser.id === interaction.user.id;
    const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isSelf && !isAdmin) {
      return interaction.reply({
        content: "You can only delete your own last roll unless you're an admin.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const profile = await UserProfile.findOne({ userId: targetUser.id });
      if (!profile) {
        return interaction.reply({
          content: 'No profile found for that user.',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!profile.inventory || profile.inventory.length === 0) {
        return interaction.reply({
          content: 'No rolls to delete for this user.',
          flags: MessageFlags.Ephemeral,
        });
      }

      const removed = profile.inventory.pop();
      const today = toGMT1DateStr(new Date());
      const lastDailyDate = profile.lastDailyClaim ? toGMT1DateStr(profile.lastDailyClaim) : null;

      // Adjust daily counters only if the removed roll was from today
      if (lastDailyDate === today && profile.numberDailyRolls > 0) {
        profile.numberDailyRolls -= 1;
      }

      profile.balance = Math.max(0, (profile.balance || 0) - 1);
      await profile.save();

      const dailyInfo = lastDailyDate === today
        ? `Daily rolls today: ${profile.numberDailyRolls}`
        : 'Daily rolls today: unchanged (last roll was earlier).';

      return interaction.reply({
        content: `Removed last roll for ${targetUser.tag}: ${removed}\nNew balance: ${profile.balance}\n${dailyInfo}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('Failed to delete last roll:', err);
      return interaction.reply({
        content: 'Failed to delete the last roll. Please try again.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
