const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.Warn,
  once: false,
  execute(client, message) {
    Logger.warn(`discord.js warning: ${message}`);
  }
};
