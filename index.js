require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder
} = require('discord.js');

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

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

    if (!file || !file.name.endsWith('.txt')) {
      return interaction.reply({
        content: '❌ Please upload a .txt file.',
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
      let currentColor = 0x5865f2; // default Discord blurple

      // 🎨 If user gives color, override everything
      if (colorInput) {
        const hex = colorInput.replace('#', '');
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
          currentColor = parseInt(hex, 16);
        }
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 🎨 File-based color (only if no override)
        if (!colorInput && /^[0-9A-Fa-f]{6}$/.test(line)) {
          currentColor = parseInt(line, 16);
          continue;
        }

        // 📌 Section Title (anything that isn't a channel or description)
        if (
          !line.startsWith('<#') &&
          !line.startsWith('→') &&
          !line.startsWith('╰') &&
          !line.startsWith('━━')
        ) {
          if (currentEmbed) embeds.push(currentEmbed);

          currentEmbed = new EmbedBuilder()
            .setTitle(line)
            .setColor(currentColor);

          continue;
        }

        // 📎 Channel + Description
        if (line.startsWith('<#')) {
          const channel = line;
          const nextLine = lines[i + 1]?.trim();

          if (nextLine && (nextLine.startsWith('→') || nextLine.startsWith('╰'))) {
            currentEmbed?.addFields({
              name: channel,
              value: nextLine.replace(/^→|^╰/, '').trim()
            });
            i++; // skip description line
          }
        }
      }

      if (currentEmbed) embeds.push(currentEmbed);

      // 🚫 Remove empty embeds (critical fix)
      embeds = embeds.filter(e => e.data.fields && e.data.fields.length > 0);

      if (embeds.length === 0) {
        return interaction.editReply('❌ No valid embed data found in file.');
      }

      await interaction.editReply(`✅ Sending ${embeds.length} embeds...`);

      for (const embed of embeds) {
        await interaction.channel.send({ embeds: [embed] });
      }

    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ ${err.message}`);
    }
  }
});

client.login(process.env.TOKEN);
