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
    return Logger.error(`Command not loaded: failed to load ↓\nFile -> ${cmdFile}\n${err?.stack ?? err}`);
  }

  // Check if the command has a name
  if (!cmd.name) return Logger.warn(`Command not loaded: missing name ↓\nFile -> ${cmdFile}`);

  // Check if the command has a description
  if (!cmd.description && cmd.type != ApplicationCommandType.User)
    return Logger.warn(`Command not loaded: missing description ↓\nFile -> ${cmdFile}`);

  // Check if the command has a category
  if (!cmd.category) return Logger.warn(`Command not loaded: missing category ↓\nFile -> ${cmdFile}`);

  // Check that the permissions are an array
  if (!Array.isArray(cmd.permissions))
    return Logger.warn(`Command not loaded: permissions must be an array ↓\nFile -> ${cmdFile}`);

  // Check if the command has correctly defined the ownerOnly
  if (cmd.ownerOnly == undefined) return Logger.warn(`Command not loaded: ownerOnly must be set ↓\nFile -> ${cmdFile}`);

  // Check if the command has a usage
  if (!cmd.usage) return Logger.warn(`Command not loaded: missing usage ↓\nFile -> ${cmdFile}`);

  // Check if the command has examples
  if (!cmd.examples) return Logger.warn(`Command not loaded: missing examples ↓\nFile -> ${cmdFile}`);

  // Check if the command has a handler
  if (typeof cmd.runInteraction !== 'function')
    return Logger.warn(`Command not loaded: missing runInteraction function ↓\nFile -> ${cmdFile}`);

  // Check that every permission is a PermissionFlagsBits value
  const invalidPermission = cmd.permissions.find((permission) => !permissionList.includes(permission));
  if (invalidPermission !== undefined)
    return Logger.typo(`Command not loaded: invalid permission '${invalidPermission}' ↓\nFile -> ${cmdFile}`);

  client.commands.set(cmd.name, cmd);
  Logger.command(`- ${cmd.name}`);
}

module.exports = (client) => {
  for (const cmdFile of listCommandFiles()) loadCommand(client, cmdFile);
};
