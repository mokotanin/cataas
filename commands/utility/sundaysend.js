const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sundaysend')
    .setDescription('Admin: send the Sunday GIF to a channel (testing).')
    .addChannelOption((option) => option.setName('channel').setDescription('Channel to send into').setRequired(false)),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: "T'es fada toi, tu sais au moins ce que tu fais ?",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const envUrl = process.env.SUNDAY_GIF_URL || 'https://media1.tenor.com/m/qyNSkc1e4esAAAAd/uma-musume-umamusume.gif';

    // Resolve target channel: option -> configured env -> current channel
    let target = interaction.options.getChannel('channel') || null;
    if (!target && process.env.SUNDAY_CHANNEL_ID) {
      try {
        target = await interaction.client.channels.fetch(process.env.SUNDAY_CHANNEL_ID);
      } catch (err) {
        // ignore, will fallback to interaction.channel
      }
    }
    if (!target) target = interaction.channel;

    if (!target || typeof target.send !== 'function') {
      return interaction.editReply({ content: 'Could not resolve a valid text channel to send into.' });
    }

    try {
      const res = await fetch(envUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const file = new AttachmentBuilder(buffer, { name: 'sunday.gif' });
      await target.send({
        content: '@everyone Happy marvelous sunday!!!!',
        files: [file],
        allowedMentions: { parse: ['everyone'] },
      });
      await interaction.editReply({ content: `Sent Sunday GIF to ${target.toString()}` });
    } catch (err) {
      console.error('Failed to send Sunday GIF (manual):', err);
      await interaction.editReply({ content: `Failed to send GIF: ${err.message}` });
    }
  },
};
