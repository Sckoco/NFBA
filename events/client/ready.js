const Logger = require('../../utils/Logger');
const { ActivityType, Events } = require('discord.js');
const { startScheduler } = require('../../scheduler');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    Logger.client('- ready!');

    client.user.setPresence({ activities: [{ name: 'son agenda', type: ActivityType.Watching }], status: 'online' });

    // Guild slash commands = instant
    // const devGuild = await client.guilds.cache.get('676023704140120070');
    // devGuild.commands.set(client.commands.map(cmd => cmd));

    // Global slash commands = up to 1h to propagate
    client.application.commands.set(client.commands.map((cmd) => cmd));

    // Start the daily birthday job only once the client is connected
    startScheduler(client);
  }
};
