const UserProfile = require('../../schemas/UserProfile');
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = global.fetch;
const dailyAmount = 5;

const prenoms = fs
  .readFileSync(path.join(__dirname, '../../prenoms.csv'), 'utf-8')
  .split(/\r?\n/)
  .map((name) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  })
  .filter(Boolean);

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('rollingu')
    .setDescription('Roll your daily cat!'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
        await interaction.reply({
          content: 'This command can only be used in a server.',
          ephemeral: true,
        });
        return;
      }

    try {
        await interaction.deferReply();

        let userProfile = await UserProfile.findOne({
           userId: interaction.member.id,
        });
        
        if (userProfile) {
          const lastDailyDate = userProfile.lastDailyClaim?.toDateString();
          const currentDate = new Date().toDateString();

          if (userProfile.numberDailyRolls >= dailyAmount) {
            await interaction.editReply("You have already claimed your daily cats!");
            return;
          }
        } else {
            userProfile = new UserProfile({
                userId: interaction.member.id,
                inventory: [],
            })
        }

        userProfile.balance += 1;
        userProfile.numberDailyRolls += 1;
        userProfile.lastDailyClaim = new Date();

        const res = await fetch("https://cataas.com/cat");
        const buffer = Buffer.from(await res.arrayBuffer());
        
        const fileName = `cat_${Math.floor(Math.random() * 98716) + 1}_${userProfile.userId}.png`;
        const randomPrenom = prenoms[Math.floor(Math.random() * prenoms.length)];
        const file = new AttachmentBuilder(buffer, { name: fileName });
        
        const embed = new EmbedBuilder()
            .setTitle("A wild cat has been summoned!")
            .setDescription(`${randomPrenom} has been added to your balance! Your new balance is ${userProfile.balance} cats.\n You have rolled daily ${userProfile.numberDailyRolls} times, the limit is ${dailyAmount}.`)
            .setImage(`attachment://${fileName}`);
        
        const rerollButton = new ButtonBuilder()
            .setCustomId('rollingu_button')
            .setLabel('Rerollingu')
            .setStyle(ButtonStyle.Primary);
        
        const row = new ActionRowBuilder().addComponents(rerollButton);
        
        const message = await interaction.editReply({ embeds: [embed], files: [file], components: [row] });
        const fetchedMessage = await interaction.channel.messages.fetch(message.id);
        const embedImage = fetchedMessage.embeds[0]?.image?.url;
        
        if (embedImage) {
          const catEntry = `${randomPrenom} : ${embedImage}`;
          userProfile.inventory.push(catEntry);
          await userProfile.save();
        }
      
    } catch (error) {
      console.log(`Error handling /rollingu: ${error}`);
    }
  },
};