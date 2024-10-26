const { Client, Collection } = require('discord.js');
const dotenv = require('dotenv');
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.dev' });
} else {
  dotenv.config({ path: '.env.prod' });
}
const client = new Client({ intents: 3276799 });
const Logger = require('./utils/Logger');
const db = require('./utils/Database');

// Collections to regroup commands
['commands'].forEach(x => client[x] = new Collection());

// Retrieving handlers
['CommandUtil', 'EventUtil'].forEach(handler => { require(`./utils/handlers/${handler}`)(client) });

// Retrieve the file containing the various functions
require('./utils/Functions')(client);

// Recover errors to avoid shutting down the bot each time
process.on('exit', code => { Logger.client(`Le processus s'est arrêté avec le code: ${code} !`) });

process.on('uncaughtException', (err, origin) => { 
  Logger.error(`UNCAUGHT EXCEPTION: ${err}`);
  console.error(`Origine: ${origin}`);
});

process.on('unhandledRejection', (reason, promise) => { 
  Logger.warn(`UNHANDLED REJECTION: ${reason}`);
  console.log(promise);
});

process.on('warning', (...args) => Logger.warn(...args));

client.login(process.env.DISCORD_TOKEN);
