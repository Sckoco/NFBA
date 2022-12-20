const { ApplicationCommandOptionType } = require("discord.js");

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

    await client.removeBirthday(target);
    return interaction.reply(`Anniversaire de ${target.user.tag} supprimé !`);
  }
}