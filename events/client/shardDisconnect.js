const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

// Only emitted when the shard will not reconnect; a recoverable loss of connection emits ShardReconnecting.
module.exports = {
  name: Events.ShardDisconnect,
  once: false,
  execute(client, closeEvent, shardId) {
    Logger.warn(`Shard ${shardId} disconnected and will not reconnect (close code ${closeEvent.code})`);
  }
};
