const { promisify } = require('util');
const { glob } = require('glob');
const pGLob = promisify(glob);
const Logger = require('../Logger');
const { ApplicationCommandType } = require('discord.js');

module.exports = async client => {
  (await pGLob(`${process.cwd()}/commands/*/*.js`)).map(async (cmdFile) => {
    const cmd = require(cmdFile);

    // Check si la commande a un nom
    if(!cmd.name) return Logger.warn(`Commande non-chargée: pas de nom ↓\nFichier -> ${cmdFile}`);

    // Check si la commande a une description
    if (!cmd.description && cmd.type != ApplicationCommandType.User) return Logger.warn(`Commande non-chargée: pas de description ↓\nFichier -> ${cmdFile}`);

    // Check si la commande a une catégorie
    if (!cmd.category) return Logger.warn(`Commande non-chargée: pas de catégorie ↓\nFichier -> ${cmdFile}`);

    // Check si la commande a une/des permission(s)
    if (!cmd.permissions) return Logger.warn(`Commande non-chargée: pas de permission ↓\nFichier -> ${cmdFile}`);

    // Check si la commande a bien défini le ownerOnly
    if (cmd.ownerOnly == undefined) return Logger.warn(`Commande non-chargée: indiquer si la commande est ownerOnly ↓\nFichier -> ${cmdFile}`);
    
    // Check si la commande a une utilisation
    if (!cmd.usage) return Logger.warn(`Commande non-chargée: pas d'utilisation (usage) ↓\nFichier -> ${cmdFile}`);
    
    // Check si la commande a des exemples
    if (!cmd.examples) return Logger.warn(`Commande non-chargée: pas d'exemples (examples) ↓\nFichier -> ${cmdFile}`);
    
    // Check si la/les permission(s) est/sont correcte(s)
    cmd.permissions.forEach(permission => {
      if (!permissionList.includes(permission)) {
        return Logger.typo(`Commande non-chargée: erreur de typo sur la permission '${permission}' ↓\nFichier -> ${cmdFile}`);
      }
    })

    client.commands.set(cmd.name, cmd);
    Logger.command(`- ${cmd.name}`);
  });
};

const permissionList = ['CREATE_INSTANT_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'ADD_REACTIONS', 'VIEW_AUDIT_LOG', 'PRIORITY_SPEAKER', 'STREAM', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'VIEW_GUILD_INSIGHTS', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'USE_VAD', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS', 'MANAGE_EMOJIS_AND_STICKERS', 'USE_APPLICATION_COMMANDS', 'REQUEST_TO_SPEAK', 'MANAGE_EVENTS', 'MANAGE_THREADS', 'USE_PUBLIC_THREADS', 'CREATE_PUBLIC_THREADS', 'USE_PRIVATE_THREADS', 'CREATE_PRIVATE_THREADS', 'USE_EXTERNAL_STICKERS', 'SEND_MESSAGES_IN_THREADS', 'START_EMBEDDED_ACTIVITIES', 'MODERATE_MEMBERS'];