const {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  InteractionContextType
} = require('discord.js');
const birthdayService = require('../../services/birthdayService');
const { formatBirthday } = require('../../utils/date');
const Logger = require('../../utils/Logger');

// Discord rejects embeds whose description is longer than 4096 characters.
const EMBED_DESCRIPTION_LIMIT = 4096;
// The page buttons are disabled after this long without a click.
const PAGINATION_TIMEOUT_MS = 5 * 60 * 1000;
const PREVIOUS_BUTTON_ID = 'viewbirthday:previous';
const NEXT_BUTTON_ID = 'viewbirthday:next';

// Returns the username of a stored user, or a placeholder if the account can no longer be fetched (deleted user).
async function resolveUsername(client, userId) {
  try {
    const user = await client.users.fetch(userId);
    return user.username;
  } catch {
    return `Utilisateur inconnu (${userId})`;
  }
}

// Splits the lines into pages, in order, each page holding as many whole lines as fit in the limit.
function paginateLines(lines, limit) {
  const pages = [];
  let page = '';
  for (const line of lines) {
    const entry = `${line}\n`;
    if (page && page.length + entry.length > limit) {
      pages.push(page);
      page = '';
    }
    page += entry;
  }
  if (page) pages.push(page);
  return pages;
}

function pageButtons(pageIndex, pageCount, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(PREVIOUS_BUTTON_ID)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || pageIndex === 0),
    new ButtonBuilder()
      .setCustomId(NEXT_BUTTON_ID)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || pageIndex === pageCount - 1)
  );
}

// Replies with the first page and lets the invoking user browse the others with buttons until they time out.
async function replyWithPages(interaction, embed, pages) {
  const footerText = interaction.user.username;
  const footerIcon = interaction.user.displayAvatarURL();
  let pageIndex = 0;

  const showPage = () =>
    embed
      .setDescription(pages[pageIndex])
      .setFooter({ text: `${footerText} • Page ${pageIndex + 1}/${pages.length}`, iconURL: footerIcon });

  if (pages.length === 1) return interaction.reply({ embeds: [embed.setDescription(pages[0])] });

  const response = await interaction.reply({
    embeds: [showPage()],
    components: [pageButtons(pageIndex, pages.length)],
    withResponse: true
  });
  const message = response.resource.message;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    idle: PAGINATION_TIMEOUT_MS
  });

  collector.on('collect', async (button) => {
    try {
      if (button.user.id !== interaction.user.id) {
        return await button.reply({
          content: 'Seule la personne ayant lancé la commande peut changer de page.',
          flags: MessageFlags.Ephemeral
        });
      }
      if (button.customId === PREVIOUS_BUTTON_ID) pageIndex = Math.max(pageIndex - 1, 0);
      if (button.customId === NEXT_BUTTON_ID) pageIndex = Math.min(pageIndex + 1, pages.length - 1);
      await button.update({ embeds: [showPage()], components: [pageButtons(pageIndex, pages.length)] });
    } catch (err) {
      Logger.error(`Error while changing viewbirthday page - ${err}`);
    }
  });

  collector.on('end', () => {
    // The message may have been deleted in the meantime; nothing to do then.
    message.edit({ components: [pageButtons(pageIndex, pages.length, true)] }).catch(() => {});
  });
}

module.exports = {
  name: 'viewbirthday',
  category: 'birthday',
  permissions: [PermissionFlagsBits.Administrator],
  contexts: [InteractionContextType.Guild],
  default_member_permissions: PermissionFlagsBits.Administrator,
  ownerOnly: false,
  usage: 'viewbirthday <@member>',
  examples: ['viewbirthday', 'viewbirthday @Sckoco'],
  description: "Voir la liste des anniversaires ou celui d'un membre",
  options: [
    {
      name: 'target',
      description: "L'utilisateur dont on souhaite connaitre l'anniversaire",
      type: ApplicationCommandOptionType.User,
      required: false
    }
  ],
  async runInteraction(client, interaction) {
    const target = interaction.options.getUser('target');

    const embed = new EmbedBuilder()
      .setTitle('🎂 Liste des anniversaires')
      .setColor('Green')
      .setTimestamp()
      .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

    try {
      if (!target) {
        const birthdays = await birthdayService.getAllBirthdays();
        if (birthdays.length === 0) {
          embed.setColor('Yellow');
          embed.setDescription('Aucun anniversaire enregistré.');
          return interaction.reply({ embeds: [embed] });
        }
        // Already sorted by date in SQL; Promise.all keeps that order.
        const lines = await Promise.all(
          birthdays.map(async (bday) => `${await resolveUsername(client, bday.user_id)} -> \`${formatBirthday(bday)}\``)
        );
        return await replyWithPages(interaction, embed, paginateLines(lines, EMBED_DESCRIPTION_LIMIT));
      }

      embed.setTitle(`🎂 L'anniversaire de ${target.username}`);
      const birthday = await birthdayService.getMemberBirthday(target);
      if (!birthday) {
        embed.setColor('Yellow');
        embed.setDescription(`Aucun anniversaire enregistré pour **${target.username}**.`);
        return interaction.reply({ embeds: [embed] });
      }
      embed.setDescription(`**${target.username}** fête son anniversaire le \`${formatBirthday(birthday)}\``);
      return interaction.reply({ embeds: [embed] });
    } catch {
      embed.setColor('Red');
      embed.setTitle('❌ Erreur lors de la recherche');
      embed.setDescription(
        `Une erreur s'est produite... Veuillez réessayer.\nSi l'erreur persiste, contactez un administrateur.`
      );
      return interaction.reply({ embeds: [embed] });
    }
  }
};
