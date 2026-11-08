const { Client, Collection, GatewayIntentBits, RESTEvents } = require('discord.js');
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

// `route` has its IDs and tokens masked by discord.js; `majorParameter` does not, so it must not be logged
client.rest.on(RESTEvents.RateLimited, ({ method, route, limit, retryAfter }) => {
  Logger.warn(`REST rate limit on ${method} ${route}: limit ${limit}, waiting ${retryAfter} ms`);
});

async function shutdown(signal) {
  Logger.client(`Received ${signal}, shutting down`);
  try {
    await client.destroy();
  } catch (err) {
    Logger.error(`Error while destroying the client:\n${err?.stack ?? err}`);
  }
  process.exit(0);
}

// once: a repeated signal falls back to Node's default and kills a stuck shutdown
['SIGINT', 'SIGTERM'].forEach((signal) => process.once(signal, () => shutdown(signal)));

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
