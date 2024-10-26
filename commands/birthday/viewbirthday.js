const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'viewbirthday',
  category: 'birthday',
  permissions: ['ADMINISTRATOR'],
  ownerOnly: false,
  usage: 'viewbirthday <@member>',
  examples: ['viewbirthday @Sckoco 27/12'],
  description: 'Voir la liste des anniversaires ou celui d\'un membre',
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
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    let embedDescription = ``;
    if(!target) {
      const birthdays = await client.getAllBirthdays();
      await birthdays.sort((a,b) => {
        let dateA = a['date'];
        let dateB = b['date'];
        let dayA = dateA.split('/')[0];
        let dayB = dateB.split('/')[0];
        let monthA = dateA.split('/')[1];
        let monthB = dateB.split('/')[1];
        if(monthA.localeCompare(monthB) == 0) {
          return dayA.localeCompare(dayB);
        }
        return monthA.localeCompare(monthB);
      });
      await birthdays.map(async bday => {
        const user = await client.users.fetch(bday['user_id']);
        embedDescription += `${user.tag} -> \`${bday['date']}\`\n`;
      });
    } else {
      embed.setTitle(`🎂 L'anniversaire de ${target.user.tag}`);
      const birthday = await client.getMemberBirthday(target);
      embedDescription = `**${target.user.username}** fête son anniversaire le \`${birthday['date']}\``;
    }
    embed.setDescription(embedDescription);
    return interaction.reply({ embeds: [embed] });
  }
}