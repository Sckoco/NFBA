const { readdirSync } = require('fs');
const path = require('path');
const Logger = require('../Logger');
const { ApplicationCommandType, PermissionFlagsBits } = require('discord.js');

const commandsDir = path.join(__dirname, '..', '..', 'commands');
const permissionList = Object.values(PermissionFlagsBits);

// Returns the paths of every commands/<category>/*.js file
function listCommandFiles() {
  return readdirSync(commandsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((dir) =>
      readdirSync(path.join(commandsDir, dir.name))
        .filter((file) => file.endsWith('.js'))
        .map((file) => path.join(commandsDir, dir.name, file))
    );
}

function loadCommand(client, cmdFile) {
  let cmd;
  try {
    cmd = require(cmdFile);
  } catch (err) {
    return Logger.error(`Commande non-chargée: erreur au chargement ↓\nFichier -> ${cmdFile}\n${err?.stack ?? err}`);
  }

  // Check if the command has a name
  if (!cmd.name) return Logger.warn(`Commande non-chargée: pas de nom ↓\nFichier -> ${cmdFile}`);

  // Check if the command has a description
  if (!cmd.description && cmd.type != ApplicationCommandType.User)
    return Logger.warn(`Commande non-chargée: pas de description ↓\nFichier -> ${cmdFile}`);

  // Check if the command has a category
  if (!cmd.category) return Logger.warn(`Commande non-chargée: pas de catégorie ↓\nFichier -> ${cmdFile}`);

  // Check if the order has permission(s)
  if (!Array.isArray(cmd.permissions))
    return Logger.warn(`Commande non-chargée: pas de permission ↓\nFichier -> ${cmdFile}`);

  // Check if the command has correctly defined the ownerOnly
  if (cmd.ownerOnly == undefined)
    return Logger.warn(`Commande non-chargée: indiquer si la commande est ownerOnly ↓\nFichier -> ${cmdFile}`);

  // Check if the command has a usage
  if (!cmd.usage) return Logger.warn(`Commande non-chargée: pas d'utilisation (usage) ↓\nFichier -> ${cmdFile}`);

  // Check if the command has examples
  if (!cmd.examples) return Logger.warn(`Commande non-chargée: pas d'exemples (examples) ↓\nFichier -> ${cmdFile}`);

  // Check if the command has a handler
  if (typeof cmd.runInteraction !== 'function')
    return Logger.warn(`Commande non-chargée: pas de fonction runInteraction ↓\nFichier -> ${cmdFile}`);

  // Check whether permission(s) is/are correct
  const invalidPermission = cmd.permissions.find((permission) => !permissionList.includes(permission));
  if (invalidPermission !== undefined)
    return Logger.typo(
      `Commande non-chargée: erreur de typo sur la permission '${invalidPermission}' ↓\nFichier -> ${cmdFile}`
    );

  client.commands.set(cmd.name, cmd);
  Logger.command(`- ${cmd.name}`);
}

module.exports = (client) => {
  for (const cmdFile of listCommandFiles()) loadCommand(client, cmdFile);
};
