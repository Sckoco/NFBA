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
    return Logger.error(
      `Evènement non déclenché: erreur au chargement ↓\nFichier -> ${eventFile}\n${err?.stack ?? err}`
    );
  }

  if (!event.name) return Logger.warn(`Evènement non déclenché: pas de nom ↓\nFichier -> ${eventFile}`);

  if (!eventList.includes(event.name))
    return Logger.typo(`Evènement non-déclenché: erreur de typo sur '${event.name}' ↓\nFichier -> ${eventFile}`);

  if (typeof event.execute !== 'function')
    return Logger.warn(`Evènement non déclenché: pas de fonction execute ↓\nFichier -> ${eventFile}`);

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
