const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  PermissionsBitField,
  InteractionContextType,
  MessageFlags
} = require('discord.js');

module.exports = {
  name: 'help',
  category: 'utils',
  permissions: [PermissionFlagsBits.SendMessages],
  contexts: [InteractionContextType.Guild],
  ownerOnly: false,
  usage: 'help <command>',
  examples: ['help', 'help ping'],
  description: 'Renvoie une liste de commandes filtrée par catégorie',
  options: [
    {
      name: 'command',
      description: 'Taper le nom de votre commande',
      type: ApplicationCommandOptionType.String,
      required: false
    }
  ],
  async runInteraction(client, interaction) {
    const prefix = '/';
    const cmdName = interaction.options.getString('command');

    if (!cmdName) {
      const noArgsEmbed = new EmbedBuilder().setColor('#6e4aff').addFields([
        {
          name: 'Listes des commandes',
          value: `Une liste de toutes les catégories disponibles et leur commandes.\nPour plus d'informations sur une commande, tapez \`${prefix}help <command>\``
        }
      ]);

      // Categories of the loaded commands, in load order
      const categories = [...new Set(client.commands.map((cmd) => cmd.category))];

      for (const category of categories) {
        noArgsEmbed.addFields([
          {
            name: `+ ${category.replace(/(^\w|\s\w)/g, (firstLetter) => firstLetter.toUpperCase())}`, // Capitalize the first letter
            value: `\`${client.commands
              .filter((cmd) => cmd.category === category)
              .map((cmd) => cmd.name)
              .join(', ')}\``
          }
        ]);
      }

      return interaction.reply({ embeds: [noArgsEmbed], flags: MessageFlags.Ephemeral });
    }

    const cmd = client.commands.get(cmdName);
    if (!cmd) return interaction.reply({ content: "Cette commande n'existe pas", flags: MessageFlags.Ephemeral });

    return interaction.reply({
      content: `
\`\`\`makefile
[Help: Commande -> ${cmd.name}] ${cmd.ownerOnly ? '/!\\ Pour les admins du bot uniquement /!\\' : ''}

${cmd.description}

Utilisation: ${prefix}${cmd.usage}
Exemples: ${prefix}${cmd.examples.join(` | ${prefix}`)}
Permissions: ${new PermissionsBitField(cmd.permissions).toArray().join(', ')}

---

Utilisation des slash commands uniquement !
{} = sous-commande(s) disponible(s) | [] = option(s) obligatoire(s) | <> = option(s) optionnelle(s)
Ne pas inclure ces caractères => {}, [] et <> dans vos commandes
\`\`\``,
      flags: MessageFlags.Ephemeral
    });
  }
};
