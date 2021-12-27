const { MessageActionRow, MessageSelectMenu, MessageButton, MessagePayload } = require('discord.js');

const Logger = require('./logger');
const { guilds } = require('./config.json');

const logger = new Logger('interactions');

const constructActionRow = (...components) => {
    return new MessageActionRow().addComponents(...components);
}

const constructButton = (roleMenu) => {
    return new MessageButton({ label: roleMenu.name, emoji: roleMenu.emoji, style: 'PRIMARY', customId: `roleMenu-${roleMenu.name}` });
};

const constructSelectMenu = (roleMenu, member) => {
    // if (defaultRole) {
    //     let defaultRoleIndex = roleMenu.roles.findIndex(role => role.value === defaultRole.value);
    //     roleMenu.roles = roleMenu.roles.filter(role => role.value !== defaultRole.value);
    //     roleMenu.roles.splice(defaultRoleIndex, 0, { ...defaultRole, default: true });
    // }
    return new MessageSelectMenu({ placeholder: roleMenu.placeholder, customId: `roleMenu-${roleMenu.name}` }).addOptions(roleMenu.roles);
};

const unhandledInteraction = async (interaction, dataType, data) => {
    logger.warn(`Unknown ${dataType}: ${data}`);
    await interaction.reply({
        content: "🚧 **Oops! Something's broken on our end, please try again later!** 🚧",
        ephemeral: true
    });
};

const handleCommandInteraction = async (interaction) => {
    logger.info(`New interaction of type ${interaction.type} with name ${interaction.commandName}`);
    if (!Object.keys(guilds).includes(interaction.guildId)) return;
    switch (interaction.commandName) {
        case 'rolemenu':
            const buttons = constructActionRow();
            let guild = guilds[interaction.guildId];
            guild.roleMenus.forEach(roleMenu => {
                buttons.addComponents(constructButton(roleMenu));
            });
            const destination = interaction.options.getChannel('destination');
            if (!destination.send) {
                interaction.reply({
                    content: `Hmmm... I don't seem to have permission to send messages in <#${destination.id}>, try a different channel?`,
                    ephemeral: true
                });
            } else {
                await destination.send({
                    content: guild.message || '',
                    components: [buttons]
                });
                await interaction.reply({
                    content: `Sent role menu to <#${destination.id}>!`,
                    ephemeral: true
                });
            }
            break;
        default:
            unhandledInteraction(interaction, 'command', interaction.commandName);
            break;
    }
};

const handleButtonInteraction = async (interaction) => {
    logger.info(`New interaction of type ${interaction.type} with customId ${interaction.customId}`);
    const [buttonAction, menuName] = interaction.customId.split('-');
    if (!Object.keys(guilds).includes(interaction.guildId)) return;
    switch (buttonAction) {
        case 'roleMenu':
            const roleMenu = guilds[interaction.guildId].roleMenus.find(menu => menu.name === menuName);
            if (!roleMenu) {
                logger.warn(`Unknown role menu: ${menuName}`);
                return;
            }
            const member = await interaction.message.guild.members.fetch(interaction.user.id);
            if (!member) {
                logger.warn(`Could not find member with id ${interaction.user.id}`);
                return;
            }
            const roleMenuDropdown = constructSelectMenu(roleMenu, member)
            await interaction.reply({
                content: roleMenu.message || '',
                ephemeral: true,
                components: [constructActionRow(roleMenuDropdown)]
            });
            break;
        default:
            unhandledInteraction(interaction, 'button action', buttonAction);
            break;
    }
};

const handleSelectMenuInteraction = async (interaction) => {
    logger.info(`New interaction of type ${interaction.type} with customId ${interaction.customId}`);
    const [menuType, menuName] = interaction.customId.split('-');
    if (!Object.keys(guilds).includes(interaction.guildId)) return;
    switch (menuType) {
        case 'roleMenu':
            const roleMenu = guilds[interaction.guildId].roleMenus.find(menu => menu.name === menuName);
            if (!roleMenu) {
                logger.warn(`Unknown role menu: ${menuName}`);
                return;
            }
            const role = roleMenu.roles.find(role => role.value === interaction.values[0]);
            if (!role) {
                logger.warn(`Unknown role: ${interaction.values[0]}`);
                return;
            }
            const member = await interaction.message.guild.members.fetch(interaction.user.id);
            if (!member) {
                logger.warn(`Could not find member with id ${interaction.user.id}`);
                return;
            }
            try {
                roleMenu.removeExisting && roleMenu.roles.forEach(role => member.roles.cache.has(role.value) && member.roles.remove(role.value));
                await member.roles.add(role.value);
            } catch (err) {
                logger.error(`Could not add/remove role ${role.value} from member ${member.id}`, err);
            }
            await interaction.reply({
                content: `Gave you the **<@&${role.value}>** role!`,
                ephemeral: true
            });
            break;
        default:
            unhandledInteraction(interaction, 'menu type', menuType);
            break;
    }
};

module.exports = async (interaction) => {
    switch (interaction.type) {
        case 'APPLICATION_COMMAND':
            handleCommandInteraction(interaction);
            break;
        case 'MESSAGE_COMPONENT':
            interaction.isButton() && handleButtonInteraction(interaction);
            interaction.isSelectMenu() && handleSelectMenuInteraction(interaction);
            break;
        default:
            unhandledInteraction(interaction, 'interaction type', interaction.type);
            break;
    }
};
