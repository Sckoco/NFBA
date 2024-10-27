const { Client, Collection, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.dev' });
} else {
  dotenv.config({ path: '.env.prod' });
}
const client = new Client({ intents: 3276799 });
const Logger = require('./utils/Logger');
const db = require('./utils/Database');
const cron = require('node-cron');
const dayjs = require('dayjs');

// Collections to regroup commands
['commands'].forEach(x => client[x] = new Collection());

// Retrieving handlers
['CommandUtil', 'EventUtil'].forEach(handler => { require(`./utils/handlers/${handler}`)(client) });

// Retrieve the file containing the various functions
require('./utils/Functions')(client);

// Recover errors to avoid shutting down the bot each time
process.on('exit', code => { Logger.client(`Le processus s'est arrêté avec le code: ${code} !`) });

process.on('uncaughtException', (err, origin) => { 
  Logger.error(`UNCAUGHT EXCEPTION - ${err}`);
  console.error(`Origine: ${origin}`);
});

process.on('unhandledRejection', (reason, promise) => { 
  Logger.warn(`UNHANDLED REJECTION: ${reason}`);
  console.log(promise);
});

process.on('warning', (...args) => Logger.warn(...args));

client.login(process.env.DISCORD_TOKEN);

cron.schedule(process.env.SCHEDULE_TIME, async () => {
  try {
    const today = dayjs().format('DD/MM');
    const birthdays = await client.getBirthdayByDate(today);

    birthdays.forEach(async bday => {
      const channel = await client.channels.cache.get(process.env.BIRTHDAY_CHANNEL_ID);
      const member = await client.users.cache.get(bday.user_id);
      const embed = new EmbedBuilder()
        .setAuthor({ name: member.username, iconURL: member.displayAvatarURL()})
        .setTitle("C'est son anniversaire ! 🎂")
        .setDescription(`Aujourd'hui on fête l'anniversaire de <@${member.id}> !
        Souhaitons lui tous une joyeuse vie !`)
        .setThumbnail("https://media0.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif?cid=ecf05e47sezpy9h9nd7j3bsnvejccv267jxa5z4tllawmr1d&rid=giphy.gif&ct=g");

      channel.send({ embeds: [embed] });
    });
  } catch (err) {
    Logger.error(`Error while checking birthdays - ${err}`);
  }
});