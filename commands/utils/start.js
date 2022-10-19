const Logger = require('../../utils/Logger');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "start",
  category: 'utils',
  permissions: ['ADMINISTRATOR'],
  ownerOnly: false,
  usage: 'start',
  examples: ['start'],
  description: "Démarrer le timer pour les checks anniversaires",
  async runInteraction(client, interaction) {
    const checkForBirthdays = async() => {

      let birthdays = {};
      try {
        const filePath = path.resolve(__dirname, "../../data/birthdays.json");
        if(!fs.existsSync(filePath)) {
          return;
        }
        const jsonString = fs.readFileSync(filePath);
        birthdays = JSON.parse(jsonString);
      } catch(err) {
        Logger.warn(err);
      }

      for(const bday in birthdays) {
        const currentDate = new Date();
        if(bday.split('/')[0] == currentDate.getDate() && bday.split('/')[1] == currentDate.getMonth()+1) {
          const channel = await client.channels.cache.get('741245976731451414');
          for(const memberId in birthdays[bday]) {
            const member = await interaction.guild.members.cache.get(birthdays[bday][memberId]);
            const embed = new EmbedBuilder()
              .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
              .setTitle("C'est son anniversaire ! 🎂")
              .setDescription(`Aujourd'hui on fête l'anniversaire de <@${member.user.id}> !
              Souhaitons lui tous une joyeuse vie !`)
              .setThumbnail("https://media0.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif?cid=ecf05e47sezpy9h9nd7j3bsnvejccv267jxa5z4tllawmr1d&rid=giphy.gif&ct=g")
              
            channel.send({ embeds: [embed] }); 
          }
          break; 
        }
      }
      
      //setTimeout(checkForBirthdays, 1000 * 10); //* TEST
      setTimeout(checkForBirthdays, 1000 * 86400);
    }

    checkForBirthdays()
    interaction.reply("Le timer est lancé !");
  }
}