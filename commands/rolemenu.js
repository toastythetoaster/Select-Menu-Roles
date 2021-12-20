const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rolemenu')
		.setDescription('Summons a role menu in the desired channel')
        .addChannelOption(option => option.setName('destination').setDescription('Select a channel').setRequired(true))
};