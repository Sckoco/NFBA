const { Events } = require('discord.js');
const Logger = require('../../utils/Logger');

module.exports = {
  name: Events.ShardReconnecting,
  once: false,
  execute(client, shardId) {
    // client.destroy() also emits this event, although nothing reconnects
    if (client.ws.destroyed) return;
    Logger.warn(`Shard ${shardId} lost its connection, reconnecting`);
  }
};
