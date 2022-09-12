const Logger = require('../../utils/Logger');
const { ActivityType } = require('discord.js');

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    Logger.client("- prêt à être utilisé !");

    client.user.setPresence({ activities: [{ name: 'son agenda', type: ActivityType.Watching }], status: 'online' });

    // Slash commands sur serveur = Instantané
    const devGuild = await client.guilds.cache.get('676023704140120070');
    devGuild.commands.set(client.commands.map(cmd => cmd));
  
    // Slash commands en global = 1h minimum
    // client.application.commands.set(client.commands.map(cmd => cmd));
  }
}