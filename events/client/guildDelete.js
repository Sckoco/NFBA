const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.GuildDelete,
  once: false,
  execute(client, guild) {
    Logger.client(`Left server ${guild.name} (${guild.id})`);
  }
};
