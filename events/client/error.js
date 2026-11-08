const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.Error,
  once: false,
  execute(client, err) {
    Logger.error(`discord.js client error:\n${err?.stack ?? err}`);
  }
};
