const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.Invalidated,
  once: false,
  execute() {
    Logger.warn('Discord session invalidated');
  }
};
