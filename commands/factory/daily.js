const UserProfile = require('../../schemas/UserProfile');
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = global.fetch;
const dailyAmount = 5;

// Helper: return a YYYY-MM-DD date string for the given date in GMT+1
const toGMT1DateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const gmt1 = new Date(d.getTime() + 3600 * 1000);
  return gmt1.toISOString().split('T')[0];
};
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
          userProfile.numberDailyRolls = userProfile.numberDailyRolls || 0;
          userProfile.balance = userProfile.balance || 0;

          const lastDailyDate = userProfile.lastDailyClaim ? toGMT1DateStr(userProfile.lastDailyClaim) : null;
          const currentDate = toGMT1DateStr(new Date());

          // If the last claim was on a different GMT+1 day, reset the daily rolls
          if (lastDailyDate !== currentDate) {
            userProfile.numberDailyRolls = 0;
          }

          if (userProfile.numberDailyRolls >= dailyAmount) {
            await interaction.editReply("You have already claimed your daily cats!");
            return;
          }
        } else {
            userProfile = new UserProfile({
                userId: interaction.member.id,
                inventory: [],
            })
            userProfile.numberDailyRolls = 0;
            userProfile.balance = 0;
        }

        userProfile.balance += 1;
        userProfile.numberDailyRolls += 1;
        userProfile.lastDailyClaim = new Date();

        // Persist the updated counters immediately so state is consistent
        await userProfile.save();

        const res = await fetch("https://cataas.com/cat");
        const buffer = Buffer.from(await res.arrayBuffer());
        
        const fileName = `cat_${Math.floor(Math.random() * 98716) + 1}_${userProfile.userId}.png`;
        const randomPrenom = prenoms[Math.floor(Math.random() * prenoms.length)];
        const file = new AttachmentBuilder(buffer, { name: fileName });

        // should create a variant file instead of multiple lines ;-;
        const apparationVariant = ["appears from a puff of smoke", "descends from the heavens", "emerges from a portal", "materializes out of thin air", 
        "drops down from above", "suddenly pops into existence", "arrives with a flash of light", "manifests in a swirl of colors", "comes forth from the shadows", "is conjured by magic",
        "teleports in with a sparkle", "is summoned by a mystical force", "appears with a burst of energy", "is called forth by an ancient spell", "materializes with a shimmering glow",
        "emerges from a vortex of light", "descends gracefully from the sky", "arrives in a cascade of stars", "is born from a cosmic event", "appears in a whirl of enchantment", "is conjured from the ether",
        "materializes in a flash of brilliance", "emerges from a rift in space", "descends on a beam of light", "arrives with a magical flourish", "is summoned from another dimension", "appears in a swirl of mystic energy"
        ];
        
        const embed = new EmbedBuilder()
            .setTitle(`${randomPrenom} the Cat ${apparationVariant[Math.floor(Math.random() * apparationVariant.length)]}!`)
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