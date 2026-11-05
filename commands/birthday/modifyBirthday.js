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
  name: 'modifybirthday',
  category: 'birthday',
  permissions: [PermissionFlagsBits.Administrator],
  contexts: [InteractionContextType.Guild],
  default_member_permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: 'modifybirthday [@member] [dd/mm]',
  examples: ['modifybirthday @Sckoco 27/12'],
  description: 'Modifier un anniversaire',
  options: [
    {
      name: 'target',
      description: "L'utilisateur dont on souhaite modifier l'anniversaire",
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
    const target = interaction.options.getMember('target');
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
      await birthdayService.updateBirthday(target, parsed);
      embed.setColor('Green');
      embed.setTitle('✅ Anniversaire modifié avec succès');
      embed.setDescription(`Anniversaire de ${target.user.username} modifié au ${date}`);
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      embed.setColor('Red');
      embed.setTitle('❌ Erreur lors de la modification');
      embed.setDescription(
        `Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`
      );
      return interaction.reply({ embeds: [embed] });
    }
  }
};
