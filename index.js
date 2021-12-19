require('dotenv').config();
const { Client, Intents, MessageActionRow, MessageSelectMenu } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { roles } = require('./config.json')

client.once('ready', () => {
    console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (interaction.commandName == 'roles') {
        const row = new MessageActionRow().addComponents(new MessageSelectMenu().setCustomId('roles').setPlaceholder('Select a reaction role').addOptions(roles));
        await interaction.reply({  content: "Select a color:",  ephemeral: true, components: [row]});
    }
});

if (interaction.isSelectMenu()) {
    const choice = interaction.values[0];
    const member = interaction.member;
    if (member.roles.cache.some(role => role.id == choice)) {
        member.roles.remove(choice);
        interaction.reply({ content: "The role was successfully removed from you", ephemeral: true });
    } else {
        member.roles.add(choice);
        await interaction.reply({ content: "The role was successfully added to you", ephemeral: true });
    }
}

client.login(process.env.TOKEN);
