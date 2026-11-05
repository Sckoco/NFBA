const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  InteractionContextType
} = require('discord.js');
const birthdayService = require('../../services/birthdayService');
const { formatBirthday } = require('../../utils/date');

module.exports = {
  name: 'viewbirthday',
  category: 'birthday',
  permissions: [PermissionFlagsBits.Administrator],
  contexts: [InteractionContextType.Guild],
  default_member_permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: 'viewbirthday <@member>',
  examples: ['viewbirthday @Sckoco 27/12'],
  description: "Voir la liste des anniversaires ou celui d'un membre",
  options: [
    {
      name: 'target',
      description: "L'utilisateur dont on souhaite connaitre l'anniversaire",
      type: ApplicationCommandOptionType.User,
      required: false
    }
  ],
  async runInteraction(client, interaction) {
    const target = interaction.options.getMember('target');

    const embed = new EmbedBuilder()
      .setTitle('🎂 Liste des anniversaires')
      .setColor('Green')
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    try {
      let embedDescription = ``;
      if (!target) {
        const birthdays = await birthdayService.getAllBirthdays();
        await birthdays.map(async (bday) => {
          const user = await client.users.fetch(bday['user_id']);
          embedDescription += `${user.username} -> \`${formatBirthday(bday)}\`\n`;
        });
      } else {
        embed.setTitle(`🎂 L'anniversaire de ${target.user.username}`);
        const birthday = await birthdayService.getMemberBirthday(target);
        embedDescription = `**${target.user.username}** fête son anniversaire le \`${formatBirthday(birthday)}\``;
      }
      embed.setDescription(embedDescription);
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      embed.setColor('Red');
      embed.setTitle('❌ Erreur lors de la recherche');
      embed.setDescription(
        `Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`
      );
      return interaction.reply({ embeds: [embed] });
    }
  }
};
