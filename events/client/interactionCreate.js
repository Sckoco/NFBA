const { InteractionType } = require("discord.js");

const ownerId = '142368606296997888';

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(client, interaction) {   
    if (interaction.type === InteractionType.ApplicationCommand || interaction.isContextMenu()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return interaction.reply('Cette commande n\'existe pas');

      if (cmd.ownerOnly) {
        if(interaction.user.id != ownerId) return interaction.reply('La seule personne pouvant taper cette commande est l\'owner du bot');
      }

      if (!interaction.member.permissions.has([cmd.permissions])) return interaction.reply({ content: `Vous n'avez pas la/les permission(s) requise(s) (\`${cmd.permissions.join(', ')}\`) pour taper cette commande !`, ephemeral: true });


      cmd.runInteraction(client, interaction);
    }
  },
};
