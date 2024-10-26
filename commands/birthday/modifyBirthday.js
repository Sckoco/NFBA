const { ApplicationCommandOptionType } = require('discord.js');

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

    // TODO: Add data verification

    await client.updateBirthday(target, date);
    return interaction.reply(`Anniversaire de ${target.user.tag} modifié au ${date}`);
  }
}