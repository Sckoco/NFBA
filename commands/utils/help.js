const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const { readdirSync } = require('fs');
const commandFolder = readdirSync('./commands');

const contextDescription = {
  userinfo: 'Renvoie des informations sur l\'utilisateur'
}

module.exports = {
  name: "help",
  category: 'utils',
  permissions: ['SEND_MESSAGES'],
  ownerOnly: false,
  usage: 'help <command>',
  examples: ['help', 'help ping', 'help emit'],
  description: "Renvoie une liste de commandes filtrée par catégorie",
  options: [
    {
      name: 'command',
      description: 'Taper le nom de votre commande',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  async runInteraction(client, interaction) {
    const prefix = '/';
    const cmdName = interaction.options.getString('command');

    if (!cmdName) {
      const noArgsEmbed = new EmbedBuilder()
        .setColor('#6e4aff')
        .addFields([{ name: 'Listes des commandes', value: `Une liste de toutes les catégories disponibles et leur commandes.\nPour plus d'informations sur une commande, tapez \`${prefix}help <command>\`` }]);

      for (const category of commandFolder) {
        noArgsEmbed.addFields([{
          name: `+ ${category.replace(/(^\w|\s\w)/g, firstLetter => firstLetter.toUpperCase())}`, //Mettre la première lettre en majuscule
          value: `\`${client.commands.filter(cmd => cmd.category == category.toLowerCase()).map(cmd => cmd.name).join(', ')}\``
        }]);
      }

      return interaction.reply({ embeds: [noArgsEmbed], ephemeral: true });
    }

    const cmd = client.commands.get(cmdName);
    if (!cmd) return interaction.reply({ content: 'Cette commande n\'existe pas', ephemeral: true });

    return interaction.reply({ content: `
\`\`\`makefile
[Help: Commande -> ${cmd.name}] ${cmd.ownerOnly ? '/!\\ Pour les admins du bot uniquement /!\\' : ''}

${cmd.description ? cmd.description : contextDescription[`${cmd.name}`]}

Utilisation: ${prefix}${cmd.usage}
Exemples: ${prefix}${cmd.examples.join(` | ${prefix}`)}
Permissions: ${cmd.permissions.join(', ')}

---

Utilisation des slash commands uniquement !
{} = sous-commande(s) disponible(s) | [] = option(s) obligatoire(s) | <> = option(s) optionnelle(s)
Ne pas inclure ces caractères => {}, [] et <> dans vos commandes
\`\`\``, ephemeral: true });
  },
};
