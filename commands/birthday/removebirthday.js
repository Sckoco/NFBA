const { ApplicationCommandOptionType } = require("discord.js");
const Logger = require('../../utils/Logger');
const fs = require('fs');
const path = require('path');

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

    try {
      const filePath = path.resolve(__dirname, "../../data/birthdays.json");
      if(!fs.existsSync(filePath)) {
        return interaction.reply("Aucun anniversaire n'a déjà été enregistré !");
      }
      const jsonString = fs.readFileSync(filePath);
      let birthdays = JSON.parse(jsonString);
      for(const bday in birthdays) {
        for(const memberId in birthdays[bday]) {
          if(birthdays[bday][memberId] == target.id) {
            birthdays[bday][memberId].pop(target.id);
            const newJsonBirthdays = JSON.stringify(birthdays);
            fs.writeFileSync(filePath, newJsonBirthdays);
            return interaction.reply(`Anniversaire de ${target.user.tag} supprimé !`);
          }
        }
      }
    } catch(err) {
      Logger.warn(err);
      return interaction.reply("Une erreur s'est produite lors de la suppression d'un anniversaire ! Veuillez contacter le développeur du bot");
    }
    return interaction.reply(`Aucun anniversaire a été enregistré pour ${target.user.tag} !`);
  }
}