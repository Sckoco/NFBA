const { promisify } = require('util');
const { glob } = require('glob');
const pGLob = promisify(glob);
const Logger = require('../Logger');
const { ApplicationCommandType, PermissionFlagsBits } = require('discord.js');

module.exports = async (client) => {
  (await pGLob(`${process.cwd()}/commands/*/*.js`)).map(async (cmdFile) => {
    const cmd = require(cmdFile);

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

    // Check whether permission(s) is/are correct
    const invalidPermission = cmd.permissions.find((permission) => !permissionList.includes(permission));
    if (invalidPermission !== undefined)
      return Logger.typo(
        `Commande non-chargée: erreur de typo sur la permission '${invalidPermission}' ↓\nFichier -> ${cmdFile}`
      );

    client.commands.set(cmd.name, cmd);
    Logger.command(`- ${cmd.name}`);
  });
};

const permissionList = Object.values(PermissionFlagsBits);
