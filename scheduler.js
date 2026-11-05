const { EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const config = require('./config');
const Logger = require('./utils/Logger');
const { BIRTHDAY_GIF_URL } = require('./constants');
const birthdayService = require('./services/birthdayService');

dayjs.extend(utc);
dayjs.extend(timezone);

let task = null;

async function announceBirthday(client, channel, bday) {
  const user = await client.users.fetch(bday.user_id);
  const embed = new EmbedBuilder()
    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
    .setTitle("C'est son anniversaire ! 🎂")
    .setDescription(`Aujourd'hui on fête l'anniversaire de <@${user.id}> !\nSouhaitons lui tous une joyeuse vie !`)
    .setThumbnail(BIRTHDAY_GIF_URL);

  await channel.send({ embeds: [embed] });
}

async function runBirthdayAnnouncement(client) {
  const today = dayjs().tz(config.timezone).format('DD/MM');
  const birthdays = await birthdayService.getBirthdayByDate(today);
  if (birthdays.length === 0) return;

  const channel = await client.channels.fetch(config.birthdayChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    Logger.error(`Birthday channel ${config.birthdayChannelId} not found or not text-based`);
    return;
  }

  for (const bday of birthdays) {
    try {
      await announceBirthday(client, channel, bday);
    } catch (err) {
      Logger.error(`Error announcing birthday for user ${bday.user_id} - ${err}`);
    }
  }
}

// Starts the daily birthday job. Called from the ready handler, so the client is connected.
// Calling it again is a no-op, so the job is never scheduled twice.
function startScheduler(client) {
  if (task) return task;

  task = cron.schedule(
    config.scheduleTime,
    async () => {
      try {
        await runBirthdayAnnouncement(client);
      } catch (err) {
        Logger.error(`Error while checking birthdays - ${err}`);
      }
    },
    {
      name: 'birthday-announcement',
      timezone: config.timezone,
      noOverlap: true
    }
  );

  Logger.client(`Birthday announcement scheduled (${config.scheduleTime}, ${config.timezone})`);
  return task;
}

module.exports = { startScheduler };
