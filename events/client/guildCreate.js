const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.GuildCreate,
  once: false,
  execute(client, guild) {
    Logger.client(`Joined server ${guild.name} (${guild.id})`);
  }
};
