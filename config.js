const cron = require('node-cron');
const Logger = require('./utils/Logger');

// Environment variables are loaded by Node itself (`node --env-file=...`, see the npm scripts)
// or set by the host. This module only reads and validates process.env.

const SNOWFLAKE = /^\d{17,20}$/;

const errors = [];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    errors.push(`${name} is missing`);
    return undefined;
  }
  return value;
}

function snowflake(name) {
  const value = required(name);
  if (value !== undefined && !SNOWFLAKE.test(value)) {
    errors.push(`${name} must be a Discord ID (17 to 20 digits), got "${value}"`);
  }
  return value;
}

function cronExpression(name) {
  const value = required(name);
  if (value !== undefined && !cron.validate(value)) {
    errors.push(`${name} must be a valid cron expression, got "${value}"`);
  }
  return value;
}

function timezone(name, fallback) {
  const value = process.env[name]?.trim() || fallback;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
  } catch {
    errors.push(`${name} must be a valid IANA timezone (e.g. Europe/Brussels), got "${value}"`);
  }
  return value;
}

const config = {
  discordToken: required('DISCORD_TOKEN'),
  ownerId: snowflake('OWNER_ID'),
  birthdayChannelId: snowflake('BIRTHDAY_CHANNEL_ID'),
  scheduleTime: cronExpression('SCHEDULE_TIME'),
  timezone: timezone('TIMEZONE', 'Europe/Brussels'),
  db: Object.freeze({
    host: required('DB_HOST'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME')
  })
};

if (errors.length > 0) {
  Logger.error(
    `Invalid configuration:\n${errors.map((e) => `  - ${e}`).join('\n')}\n` +
      'Check your env file (see .env.example) or the variables set on the host.'
  );
  process.exit(1);
}

module.exports = Object.freeze(config);
