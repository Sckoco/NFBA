const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.ShardResume,
  once: false,
  execute(client, shardId, replayedEvents) {
    Logger.client(`Shard ${shardId} resumed (${replayedEvents} replayed event(s))`);
  }
};
