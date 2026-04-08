require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder
} = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'txttoembed') {
    const file = interaction.options.getAttachment('file');
    const colorInput = interaction.options.getString('color');

    if (!file.name.endsWith('.txt')) {
      return interaction.reply({
        content: '❌ Only .txt files allowed.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const res = await fetch(file.url);
      const text = await res.text();

      const lines = text.split(/\r?\n/);

      let embeds = [];
      let currentEmbed = null;

      let currentColor = 0x5865F2;

      if (colorInput) {
        const hex = colorInput.replace('#', '');
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
          currentColor = parseInt(hex, 16);
        }
      }

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;

        if (!colorInput && /^[0-9a-fA-F]{6}$/.test(line)) {
          currentColor = parseInt(line, 16);
          continue;
        }

        if (
          !line.startsWith('<#') &&
          !line.startsWith('→') &&
          !line.startsWith('━━')
        ) {
          if (currentEmbed) embeds.push(currentEmbed);

          currentEmbed = new EmbedBuilder()
            .setTitle(line)
            .setColor(currentColor);

          continue;
        }

        if (line.startsWith('<#')) {
          const channel = line;
          const nextLine = lines[i + 1]?.trim();

          if (nextLine && nextLine.startsWith('→')) {
            currentEmbed?.addFields({
              name: channel,
              value: nextLine.replace('→', '').trim()
            });
            i++;
          }
        }
      }

      if (currentEmbed) embeds.push(currentEmbed);

      await interaction.editReply(`✅ Sending ${embeds.length} embeds...`);

      for (const embed of embeds) {
        await interaction.channel.send({ embeds: [embed] });
      }

    } catch (err) {
      console.error(err);
      interaction.editReply('❌ Failed to process file.');
    }
  }
});

client.login(process.env.TOKEN);