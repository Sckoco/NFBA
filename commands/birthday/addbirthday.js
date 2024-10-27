const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'addbirthday',
  category: 'birthday',
  permissions: ['ADMINISTRATOR'],
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


    //TODO: Add data verification for date

    try {
      const birthday = await client.getMemberBirthday(target);
      if(birthday) {
        embed.setColor('Yellow');
        embed.setTitle('Anniversaire déjà existant');
        embed.setDescription(`L'anniversaire de ${target.user.username} est déjà enregistré ! Utiliser la commande \`/modifybirthday\` pour changer la date`);
        return interaction.reply({ embeds: [embed] });
      } else {
        await client.createBirthday(target, date);
        embed.setColor('Green');
        embed.setTitle('✅ Anniversaire ajouté avec succès');
        embed.setDescription(`Anniversaire de ${target.user.username} ajouté au ${date}`);
        return interaction.reply({ embeds: [embed] });
      } 
    } catch (err) {
      embed.setColor('Red');
      embed.setTitle(`❌ Erreur lors de l'ajout`);
      embed.setDescription(`Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`);
      return interaction.reply({ embeds: [embed] });
    }
  }
}