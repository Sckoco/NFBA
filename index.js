const { Client, Collection } = require('discord.js');
const dotenv = require('dotenv'); dotenv.config();
const mongoose = require('mongoose');
const client = new Client({ intents: 3276799 });
const Logger = require('./utils/Logger');

// Collections pour regrouper les commandes
['commands'].forEach(x => client[x] = new Collection());

// Récupérer les différents handlers
['CommandUtil', 'EventUtil'].forEach(handler => { require(`./utils/handlers/${handler}`)(client) });

// Récupérer le fichier contenant les différentes fonctions
require('./utils/Functions')(client);

// Récupérer les erreurs pour éviter l'arrêt du bot à chaque fois
process.on('exit', code => { Logger.client(`Le processus s'est arrêté avec le code: ${code} !`) });

process.on('uncaughtException', (err, origin) => { 
  Logger.error(`UNCAUGHT EXCEPTION: ${err}`);
  console.error(`Origine: ${origin}`);
});

process.on('unhandledRejection', (reason, promise) => { 
  Logger.warn(`UNHANDLED REJECTION: ${reason}`);
  console.log(promise);
});

process.on('warning', (...args) => Logger.warn(...args));

mongoose.connect(process.env.DATABASE_URI_DEV, {
  autoIndex: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
}).then(() => { Logger.client('- connecté à la base de données') })
  .catch((err) => { Logger.error(err) });

client.login(process.env.DISCORD_TOKEN_DEV);