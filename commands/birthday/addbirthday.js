const { ApplicationCommandOptionType } = require('discord.js');
const Logger = require('../../utils/Logger');
const fs = require('fs');
const path = require('path');

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
  runInteraction(client, interaction) {
    const target = interaction.options.getMember('target');
    const date = interaction.options.getString('date');

    // TODO: Ajouter vérification des données

    // * Fonction utilisant la date comme clé et les utilisateurs en array
    try {
      const filePath = path.resolve(__dirname, "../../data/birthdays.json");
      const jsonString = fs.readFileSync(filePath);
      let birthdays = JSON.parse(jsonString);
      if(!birthdays[date]) {
        birthdays[date] = [target.id];
      } else {
        birthdays[date] += ","+target.id;
      }
      const jsonBirthdayToAdd = JSON.stringify(birthdays);
      fs.writeFileSync(filePath, jsonBirthdayToAdd);
      return interaction.reply(`Anniversaire de ${target.user.tag} ajouté au ${date}`);
    } catch(err) {
      Logger.warn(err);
      return;
    }

    // * Fonction utilisant le format {user, date} pour enregistrer les anniversaires
    // ! NE FONCTIONNE PAS
    // try {
    //   const filePath = path.resolve(__dirname, "../../data/birthdays.json");
    //   const jsonString = fs.readFileSync(filePath);
    //   let birthdays = JSON.parse(jsonString);
    //   if(!birthdays.date) {
    //     birthdays = {user: target.id, date: date}
    //   } else {
    //     birthdays.add({user: target.id, date: date});
    //   }
    //   const jsonBirthdayToAdd = JSON.stringify(birthdays);
    //   fs.writeFileSync(filePath, jsonBirthdayToAdd);
    //   return interaction.reply(`Anniversaire de ${target.user.tag} ajouté au ${date}`);
    // } catch(err) {
    //   Logger.warn(err);
    //   return;
    // }
  }
}