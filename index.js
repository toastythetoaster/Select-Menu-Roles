require('dotenv').config();
const { Client, Intents, MessageActionRow, MessageSelectMenu, MessageButton, MessagePayload } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { guilds } = require('./config.json');

client.once('ready', () => {
    console.log('[CLIENT] Bot is in ready state');
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (!Object.keys(guilds).includes(interaction.guildId)) return;
    console.log(`[INTERACTIONS] New interaction of type COMMAND with name ${interaction.commandName}`);
	switch (interaction.commandName) {
        case 'test':
            const buttons = new MessageActionRow();
            let guild = guilds[interaction.guildId];
            guild.roleMenus.forEach(roleMenu => {
                buttons.addComponents(new MessageButton({ label: roleMenu.name, emoji: roleMenu.emoji, style: 'PRIMARY', customId: `roleMenu-${interaction.guildId}-${roleMenu.name}` }));
            });
            await interaction.reply(new MessagePayload(interaction.channel, {
                content: guild.message,
                components: [buttons]
            }));
            break;
        default:
            console.log(`[INTERACTIONS] Unknown command: ${interaction.commandName}`);
            await interaction.reply({
                content: "🚧 **Oops! Something's broken on our end, please try again later!** 🚧",
                ephemeral: true
            });
            break;
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    console.log(`[INTERACTIONS] New interaction of type BUTTON with customId ${interaction.customId}`);
    const [buttonAction, _, menuName] = interaction.customId.split('-');
    if (!Object.keys(guilds).includes(interaction.guildId)) return;
    switch (buttonAction) {
        case 'roleMenu':
            const roleMenu = guilds[interaction.guildId].roleMenus.find(menu => menu.name === menuName);
            if (!roleMenu) {
                console.log(`[INTERACTIONS] Unknown role menu: ${menuName}`);
                return;
            }
            const member = await interaction.message.guild.members.fetch(interaction.user.id);
            if (!member) {
                console.log(`[INTERACTIONS] Could not find member with id ${interaction.user.id}`);
                return;
            }
            let currentRole = roleMenu.roles.find(role => member.roles.cache.has(role.value));
            const roleMenuDropdown = constructRoleMenuDropdown(interaction.guildId, roleMenu, currentRole || null);
            await interaction.reply({
                content: roleMenu.message,
                ephemeral: true,
                components: [roleMenuDropdown]
            });
            break;
        default:
            console.log(`[INTERACTIONS] Unknown button action: ${buttonAction}`);
            await interaction.reply({
                content: "🚧 **Oops! Something's broken on our end, please try again later!** 🚧",
                ephemeral: true
            });
            break;
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu()) return;
    console.log(`[INTERACTIONS] New interaction of type SELECT_MENU with customId ${interaction.customId}`);
    const [menuType, _, menuName] = interaction.customId.split('-');
    if (!Object.keys(guilds).includes(interaction.guildId)) return;
    switch (menuType) {
        case 'roleMenu':
            const roleMenu = guilds[interaction.guildId].roleMenus.find(menu => menu.name === menuName);
            if (!roleMenu) {
                console.log(`[INTERACTIONS] Unknown role menu: ${menuName}`);
                return;
            }
            const role = roleMenu.roles.find(role => role.value === interaction.values[0]);
            if (!role) {
                console.log(`[INTERACTIONS] Unknown role: ${interaction.values[0]}`);
                return;
            }
            const member = await interaction.message.guild.members.fetch(interaction.user.id);
            if (!member) {
                console.log(`[INTERACTIONS] Could not find member with id ${interaction.user.id}`);
                return;
            }
            try {
                roleMenu.removeExisting && roleMenu.roles.forEach(role => member.roles.cache.has(role.value) && member.roles.remove(role.value));
                await member.roles.add(role.value);
            } catch (err) {
                console.log(`[INTERACTIONS] Could not add role ${role.value} to member ${member.id}`);
                console.log(err);
            }
            await interaction.reply({
                content: `Gave you the **<@&${role.value}>** role!`,
                ephemeral: true,
                components: []
            });
            break;
        default:
            console.log(`[INTERACTIONS] Unknown menuType: ${menuType}`);
            await interaction.update({
                content: "🚧 **Oops! Something's broken on our end, please try again later!** 🚧",
                ephemeral: true,
                components: []
            });
            break;
    }
});

const constructRoleMenuDropdown = (guildId, roleMenu, defaultRole) => {
    if (defaultRole) {
        let defaultRoleIndex = roleMenu.roles.findIndex(role => role.value === defaultRole.value);
        roleMenu.roles = roleMenu.roles.filter(role => role.value !== defaultRole.value);
        roleMenu.roles.splice(defaultRoleIndex, 0, { ...defaultRole, default: true });
    }
    return new MessageActionRow().addComponents(new MessageSelectMenu()
        .setCustomId(`roleMenu-${guildId}-${roleMenu.name}`)
        .setPlaceholder(roleMenu.placeholder)
        .addOptions(roleMenu.roles)
    );
}

client.login(process.env.TOKEN).then(() => console.log(`[GATEWAY] Logged into the gateway as ${client.user.tag} with ID ${client.user.id}`));
