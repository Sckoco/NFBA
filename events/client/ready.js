const Logger = require('../../utils/Logger');
const { ActivityType, Events } = require('discord.js');
const { startScheduler } = require('../../scheduler');
const { execute } = require('../../utils/Database');

// Global slash commands = up to 1h to propagate
async function registerCommands(client) {
  try {
    const registered = await client.application.commands.set(client.commands.map((cmd) => cmd));
    Logger.client(`${registered.size} slash command(s) registered`);
  } catch (err) {
    Logger.error(`Could not register slash commands:\n${err?.stack ?? err}`);
  }
}

// The pool connects lazily: without this check, a bad password or a stopped MySQL only shows at the first query.
async function checkDatabase() {
  try {
    await execute('SELECT 1');
    Logger.client('Database reachable');
  } catch (err) {
    Logger.error(`Database unreachable:\n${err?.stack ?? err}`);
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    Logger.client(
      `Logged in as ${client.user.tag} - ${client.guilds.cache.size} server(s), ${client.commands.size} command(s) loaded`
    );

    client.user.setPresence({ activities: [{ name: 'son agenda', type: ActivityType.Watching }], status: 'online' });

    // Guild slash commands = instant
    // const devGuild = await client.guilds.cache.get('676023704140120070');
    // devGuild.commands.set(client.commands.map(cmd => cmd));

    await registerCommands(client);
    await checkDatabase();

    // Start the daily birthday job only once the client is connected
    startScheduler(client);
  }
};
