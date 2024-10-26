const { EmbedBuilder } = require('discord.js');

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
      const currentDate = new Date();
      const date = currentDate.getDate() + "/" + (currentDate.getMonth()+1);
      const birthdays = await client.getBirthdayByDate(date);

      birthdays.forEach(async bday => {
        const channel = await client.channels.cache.get(process.env.BIRTHDAY_CHANNEL_ID);
        const member = await interaction.guild.members.cache.get(bday.user_id);
        const embed = new EmbedBuilder()
          .setAuthor({ name: `${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
          .setTitle("C'est son anniversaire ! 🎂")
          .setDescription(`Aujourd'hui on fête l'anniversaire de <@${member.user.id}> !
          Souhaitons lui tous une joyeuse vie !`)
          .setThumbnail("https://media0.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif?cid=ecf05e47sezpy9h9nd7j3bsnvejccv267jxa5z4tllawmr1d&rid=giphy.gif&ct=g")
          
        channel.send({ embeds: [embed] });
      });
      
      setTimeout(checkForBirthdays, 1000 * 10); //* TEST
      //setTimeout(checkForBirthdays, 1000 * 86400);
    }

    checkForBirthdays()
    interaction.reply("Le timer est lancé !");
  }
}
