const { MessageFlags, PermissionsBitField } = require('discord.js');
const config = require('../../config');
const Logger = require('../../utils/Logger');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(client, interaction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return await refuse(interaction, 'unknown command', "Cette commande n'existe pas");

      // Commands are registered with `contexts: [InteractionContextType.Guild]`, but stale
      // registrations or unexpected payloads can still reach us without a guild member.
      if (!interaction.inGuild() || !interaction.memberPermissions)
        return await refuse(interaction, 'outside a guild', 'Cette commande ne peut être utilisée que sur un serveur');

      if (cmd.ownerOnly && interaction.user.id !== config.ownerId)
        return await refuse(
          interaction,
          'owner only',
          "La seule personne pouvant taper cette commande est l'owner du bot"
        );

      if (!interaction.memberPermissions.has(cmd.permissions))
        return await refuse(
          interaction,
          'missing permissions',
          `Vous n'avez pas la/les permission(s) requise(s) (\`${new PermissionsBitField(cmd.permissions).toArray().join(', ')}\`) pour taper cette commande !`
        );

      const label = `/${cmd.name} (${interaction.user.username} - ${interaction.user.id})`;
      const startedAt = Date.now();
      Logger.command(`${label} started in guild ${interaction.guildId}`);
      try {
        await cmd.runInteraction(client, interaction);
      } finally {
        // "finished", not "succeeded": commands catch their own database errors and answer with an embed
        Logger.command(`${label} finished in ${Date.now() - startedAt} ms`);
      }
    } catch (err) {
      Logger.error(`Error while running command '${interaction.commandName}':\n${err?.stack ?? err}`);
      try {
        await reply(interaction, "Une erreur s'est produite lors de l'exécution de cette commande.");
      } catch (replyErr) {
        Logger.error(
          `Could not send the error message for '${interaction.commandName}':\n${replyErr?.stack ?? replyErr}`
        );
      }
    }
  }
};

function refuse(interaction, reason, content) {
  Logger.warn(
    `/${interaction.commandName} refused for ${interaction.user.username} - ${interaction.user.id}: ${reason}`
  );
  return reply(interaction, content);
}

// Sends an ephemeral message, whether or not the interaction has already been answered.
function reply(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
  return interaction.reply(payload);
}
