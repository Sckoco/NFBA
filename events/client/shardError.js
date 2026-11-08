const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.ShardError,
  once: false,
  execute(client, err, shardId) {
    Logger.error(`Shard ${shardId} connection error:\n${err?.stack ?? err}`);
  }
};
