const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const Logger = require('./utils/Logger');

// Interactions and REST fetches (users, channels) only need the Guilds intent
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Collections to regroup commands
['commands'].forEach((x) => (client[x] = new Collection()));

// Retrieving handlers
['CommandUtil', 'EventUtil'].forEach((handler) => {
  require(`./utils/handlers/${handler}`)(client);
});

process.on('exit', (code) => {
  Logger.client(`Process exited with code ${code}`);
});

// The process is in an unknown state after an uncaught exception: log it and exit,
// and let the process manager (pm2, systemd, Docker) restart the bot
process.on('uncaughtException', (err, origin) => {
  Logger.error(`UNCAUGHT EXCEPTION (${origin})`);
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  Logger.error('UNHANDLED REJECTION');
  console.error(reason instanceof Error ? reason.stack : reason);
});

process.on('warning', (...args) => Logger.warn(...args));

client.login(config.discordToken);
