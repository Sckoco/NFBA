const { readdirSync } = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const Logger = require('../Logger');

const eventsDir = path.join(__dirname, '..', '..', 'events');
const eventList = Object.values(Events);

// Returns the paths of every events/<emitter>/*.js file
function listEventFiles() {
  return readdirSync(eventsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(path.join(eventsDir, dir.name))
        .filter((file) => file.endsWith('.js'))
        .map((file) => path.join(eventsDir, dir.name, file))
    );
}

function loadEvent(client, eventFile) {
  let event;
  try {
    event = require(eventFile);
  } catch (err) {
    return Logger.error(`Event not registered: failed to load ↓\nFile -> ${eventFile}\n${err?.stack ?? err}`);
  }

  if (!event.name) return Logger.warn(`Event not registered: missing name ↓\nFile -> ${eventFile}`);

  if (!eventList.includes(event.name))
    return Logger.typo(`Event not registered: unknown event name '${event.name}' ↓\nFile -> ${eventFile}`);

  if (typeof event.execute !== 'function')
    return Logger.warn(`Event not registered: missing execute function ↓\nFile -> ${eventFile}`);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }

  Logger.event(`- ${event.name}`);
}

module.exports = (client) => {
  for (const eventFile of listEventFiles()) loadEvent(client, eventFile);
};
