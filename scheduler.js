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

// Returns the birthday channel, or null (with the reason logged) if it cannot be used.
async function fetchBirthdayChannel(client) {
  try {
    const channel = await client.channels.fetch(config.birthdayChannelId);
    if (channel?.isTextBased()) return channel;
    Logger.error(`Birthday channel ${config.birthdayChannelId} not found or not text-based`);
  } catch (err) {
    Logger.error(`Could not fetch birthday channel ${config.birthdayChannelId}:\n${err?.stack ?? err}`);
  }
  return null;
}

function logSummary(sent, failed) {
  Logger.client(`Birthday check finished: ${sent} sent, ${failed} failed`);
}

async function runBirthdayAnnouncement(client) {
  const now = dayjs().tz(config.timezone);
  const today = { day: now.date(), month: now.month() + 1, year: now.year() };
  Logger.client(`Birthday check started for ${now.format('YYYY-MM-DD')}`);

  const birthdays = await birthdayService.getBirthdaysCelebratedOn(today);
  Logger.client(`${birthdays.length} birthday(s) found`);
  if (birthdays.length === 0) return logSummary(0, 0);

  const channel = await fetchBirthdayChannel(client);
  if (!channel) return logSummary(0, birthdays.length);

  let sent = 0;
  let failed = 0;
  for (const bday of birthdays) {
    try {
      await announceBirthday(client, channel, bday);
      sent++;
      Logger.client(`Birthday announced for user ${bday.user_id}`);
    } catch (err) {
      failed++;
      Logger.error(`Error announcing birthday for user ${bday.user_id}:\n${err?.stack ?? err}`);
    }
  }
  logSummary(sent, failed);
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
        Logger.error(`Error while checking birthdays:\n${err?.stack ?? err}`);
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
