const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: 'removebirthday',
  category: 'birthday',
  permissions: ['ADMINISTRATOR'],
  ownerOnly: false,
  usage : 'removebirthday [@member]',
  examples: ['removebirthday @Sckoco'],
  description: 'Supprimer un anniversaire',
  options: [
    {
      name: 'target',
      description: "L'utilisateur dont on souhaite retirer l'anniversaire",
      type: ApplicationCommandOptionType.User,
      required: true
    }
  ],
  async runInteraction(client, interaction) {
    const target = interaction.options.getMember('target');
    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    try {
      await client.removeBirthday(target);
      embed.setColor('Green');
      embed.setTitle('✅ Anniversaire supprimé avec succès');
      embed.setDescription(`Anniversaire de ${target.user.username} supprimé !`);
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      embed.setColor('Red');
      embed.setTitle('❌ Erreur lors de la suppression');
      embed.setDescription(`Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`)
      return interaction.reply({ embeds: [embed] });
    }
  }
}