require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('txttoembed')
    .setDescription('Convert txt file into embeds')
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('Upload your txt file')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Optional hex color (#ff0000)')
        .setRequired(false)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering command...');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Done');
  } catch (err) {
    console.error(err);
  }
})();