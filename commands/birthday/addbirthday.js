const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  InteractionContextType,
  MessageFlags
} = require('discord.js');
const birthdayService = require('../../services/birthdayService');
const { parseBirthday, formatBirthday } = require('../../utils/date');

module.exports = {
  name: 'addbirthday',
  category: 'birthday',
  permissions: [PermissionFlagsBits.Administrator],
  contexts: [InteractionContextType.Guild],
  default_member_permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: 'addbirthday [@member] [dd/mm]',
  examples: ['addbirthday @Sckoco 27/12'],
  description: 'Ajouter un anniversaire',
  options: [
    {
      name: 'target',
      description: "L'utilisateur dont on souhaite ajouter l'anniversaire",
      type: ApplicationCommandOptionType.User,
      required: true
    },
    {
      name: 'date',
      description: "La date de l'anniversaire, au format JJ/MM (ex. : 27/12)",
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  async runInteraction(client, interaction) {
    const target = interaction.options.getUser('target');
    const input = interaction.options.getString('date');

    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    const parsed = parseBirthday(input);
    if (!parsed) {
      embed.setColor('Red');
      embed.setTitle('❌ Date invalide');
      embed.setDescription(
        `La date \`${input}\` n'est pas valide. Utilisez le format JJ/MM avec une date qui existe (ex. : \`27/12\` ou \`29/02\`).`
      );
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
    const date = formatBirthday(parsed);

    try {
      const created = await birthdayService.createBirthday(target, parsed);
      if (!created) {
        embed.setColor('Yellow');
        embed.setTitle('Anniversaire déjà existant');
        embed.setDescription(
          `L'anniversaire de ${target.username} est déjà enregistré ! Utiliser la commande \`/modifybirthday\` pour changer la date`
        );
        return interaction.reply({ embeds: [embed] });
      }
      embed.setColor('Green');
      embed.setTitle('✅ Anniversaire ajouté avec succès');
      embed.setDescription(`Anniversaire de ${target.username} ajouté au ${date}`);
      return interaction.reply({ embeds: [embed] });
    } catch {
      embed.setColor('Red');
      embed.setTitle(`❌ Erreur lors de l'ajout`);
      embed.setDescription(
        `Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`
      );
      return interaction.reply({ embeds: [embed] });
    }
  }
};
