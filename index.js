require('dotenv').config();
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const handleInteractions = require('./interactions');
const Logger = require('./logger');
const logger = new Logger('client');

client.once('ready', () => {
    logger.info('Ready and rarin\' to go!');
});

client.on('interactionCreate', handleInteractions);

client.login(process.env.TOKEN).then(() => logger.info(`Logged into the gateway as ${client.user.tag} with ID ${client.user.id}`));
