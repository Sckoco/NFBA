const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'modifybirthday',
  category: 'birthday',
  permissions: ['ADMINISTRATOR'],
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
      description: "La date de l'anniversaire",
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  async runInteraction(client, interaction) {
    const target = interaction.options.getMember('target');
    const date = interaction.options.getString('date');
    
    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    // TODO: Add data verification

    try {
      await client.updateBirthday(target, date);
      embed.setColor('Green');
      embed.setTitle('✅ Anniversaire modifié avec succès');
      embed.setDescription(`Anniversaire de ${target.user.username} modifié au ${date}`);
      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      embed.setColor('Red');
      embed.setTitle('❌ Erreur lors de la modification');
      embed.setDescription(`Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`);
      return interaction.reply({ embeds: [embed] });
    }
  }
}