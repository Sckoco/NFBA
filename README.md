# NFBA - Discord Bot

NFBA is a Discord bot that stores the birthdays of server members and posts a message in a channel on each member's birthday.

Administrators register birthdays with slash commands. Every day at a configured time, the bot posts a birthday message for each member whose birthday it is. All text that users see is in French.

## Contents

- [Requirements](#requirements)
- [Setup](#setup)
- [Running the bot](#running-the-bot)
- [Commands](#commands)
- [Development](#development)
- [Deploying to the VPS](#deploying-to-the-vps)
- [Project structure](#project-structure)

## Requirements

- **Node.js 22** (`engines.node` is `22.x`). The npm scripts use Node's built-in `--env-file` option.
- **MySQL 8.0.16 or later**. Older versions don't enforce the `CHECK` constraints in the schema.
- A **Discord application** with a bot user, created in the [Discord Developer Portal](https://discord.com/developers/applications).

## Setup

### 1. Install the dependencies

```bash
npm ci
```

`npm ci` installs the exact versions locked in `package-lock.json`. Use it instead of `npm install`, which may update the lockfile.

### 2. Create the Discord bot

1. In the Developer Portal, open your application. On the **Bot** page, copy the token. It goes in `DISCORD_TOKEN`.
2. The bot only uses the `Guilds` intent, so you can leave all privileged gateway intents turned off.
3. Invite the bot to your server with the `bot` and `applications.commands` scopes. In the birthday channel, it needs **View Channel**, **Send Messages** and **Embed Links**.

To copy Discord IDs (`OWNER_ID`, `BIRTHDAY_CHANNEL_ID`), turn on **Developer Mode** in Discord (User Settings → Advanced), then right-click a user or channel and choose **Copy ID**.

### 3. Create the database

For a **new database**, create it and load the schema:

```bash
mysql -u <user> -p -e "CREATE DATABASE nfba CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
mysql -u <user> -p nfba < sql/schema.sql
```

The schema creates a single table, `birthdays(user_id PRIMARY KEY, day, month)`.

For an **existing database**, don't load the schema. Apply the migrations in [`sql/migrations/`](sql/migrations/) in numerical order instead (see [Migrations](#migrations)).

### 4. Configure the environment

The bot reads its settings from environment variables. Copy the template and fill it in:

```bash
cp .env.example .env.dev    # for development (npm start)
cp .env.example .env.prod   # for production (npm run prod)
```

`.env`, `.env.dev` and `.env.prod` are git-ignored. Never put real values in `.env.example`, which is tracked.

| Variable              | Required | Description                                                                                                                              |
| --------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `DISCORD_TOKEN`       | yes      | The bot token.                                                                                                                           |
| `OWNER_ID`            | yes      | Discord ID of the bot owner, for owner-only commands.                                                                                    |
| `DB_HOST`             | yes      | MySQL host.                                                                                                                              |
| `DB_USER`             | yes      | MySQL user.                                                                                                                              |
| `DB_PASSWORD`         | yes      | MySQL password.                                                                                                                          |
| `DB_NAME`             | yes      | MySQL database name.                                                                                                                     |
| `BIRTHDAY_CHANNEL_ID` | yes      | Discord ID of the channel where birthday messages are posted.                                                                            |
| `SCHEDULE_TIME`       | yes      | [Cron expression](https://nodecron.com/cron-syntax.html) for the daily check, for example `0 9 * * *` for 09:00.                         |
| `TIMEZONE`            | no       | IANA timezone used for `SCHEDULE_TIME` and for today's date. Defaults to `Europe/Brussels`.                                              |
| `NODE_ENV`            | no       | `development` logs every database query (the logs contain user IDs). Use `production`, or leave it unset, in production. |

At startup, [`config.js`](config.js) validates the variables. If any are missing or invalid, the bot exits with a message listing all of them. Discord IDs must have 17 to 20 digits, `SCHEDULE_TIME` must be a valid cron expression and `TIMEZONE` must be a valid IANA timezone.

## Running the bot

```bash
npm start      # development: node --env-file=.env.dev index.js
npm run prod   # production:  node --env-file=.env.prod index.js
```

`--env-file` makes Node exit if the file doesn't exist. If the variables are set by the host instead of a file (see [Deploying to the VPS](#deploying-to-the-vps)), start the bot with `node index.js`.

When it starts, the bot registers its slash commands as **global** commands. After a command definition changes, Discord can take up to an hour to show the update. The daily birthday job then starts. At `SCHEDULE_TIME`, in `TIMEZONE`, it posts a message in `BIRTHDAY_CHANNEL_ID` for each member whose birthday is today. In non-leap years, 29/02 birthdays are celebrated on 28/02.

## Commands

| Command                              | Who can use it | Description                                                                                              |
| ------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------- |
| `/addbirthday <target> <date>`       | Administrators | Registers a member's birthday. The date is `D/M` or `DD/MM`, for example `27/12`. 29/02 is accepted.     |
| `/modifybirthday <target> <date>`    | Administrators | Changes a member's registered birthday.                                                                  |
| `/removebirthday <target>`           | Administrators | Deletes a member's birthday.                                                                             |
| `/viewbirthday [target]`             | Administrators | Without a target, lists every birthday sorted by date, with page buttons for long lists. With a target, shows that member's birthday. |
| `/help [command]`                    | Everyone       | Lists the commands by category, or shows the details of one command.                                     |
| `/ping`                              | Everyone       | Shows the bot and API latency.                                                                           |

Discord hides the administrator commands from members who don't have the **Administrator** permission. The commands only work in a server, not in DMs.

## Development

```bash
npm test               # unit tests (node:test, in test/)
npm run lint           # ESLint
npm run format         # Prettier, rewrites files
npm run format:check   # Prettier, check only
```

Run `npm test`, `npm run lint` and `npm run format:check` before you commit. The CI workflow ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `npm ci`, `npm run lint` and `npm test` on every pull request to `dev` and `main`.

The unit tests cover the date helpers in [`utils/date.js`](utils/date.js). None of the tests need Discord or a database.

**Workflow:** pull requests target `dev`, and `dev` is merged into `main` for releases.

**Conventions:**

- CommonJS modules (`require` / `module.exports`).
- Prettier is the source of truth for formatting. Don't mix formatting changes with logic changes in one commit.
- Text that users see is in French. Code, comments and logs are in English.
- Read settings from `config`, never from `process.env` directly. Add any new setting to `config.js` and `.env.example`.
- Use `?` placeholders for every SQL query.

**Adding a command:** create a file in `commands/<category>/`, where `category` is the folder name. It must export `name`, `description`, `category`, `permissions` (an array of `PermissionFlagsBits` values), `ownerOnly`, `usage`, `examples` and `runInteraction(client, interaction)`. It can also export `options`. A command that is missing a field is logged and not loaded. Restart the bot to register it.

**Adding an event:** create a file in `events/<emitter>/` that exports `name` (a value of the discord.js `Events` enum), `once` and `execute(client, ...args)`.

### Migrations

Every schema change needs two things: an update to [`sql/schema.sql`](sql/schema.sql), and a new numbered file in [`sql/migrations/`](sql/migrations/) that upgrades existing databases.

To apply a migration to an existing database:

1. Back up the database.
2. Run the migration on a copy first. Follow the comments in the file, which split it into steps and pre-checks.
3. Stop the bot, run the migration on the real database, deploy the matching code, then start the bot. The old code doesn't work with the new schema, and the new code doesn't work with the old one.

| Migration                                                                | Change                                                                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [`001_day_month.sql`](sql/migrations/001_day_month.sql) | Replaces the `date` text column (`DD/MM`) with `day` and `month` columns, and makes `user_id` unique. Needs MySQL 8.0.16+. |

## Deploying to the VPS

### Process manager

The bot must run under a process manager that restarts it when it stops. After an uncaught exception, the bot logs the error and exits with code 1, so that it restarts in a clean state instead of continuing in an unknown one. The process manager should also start the bot when the VPS boots. Any process manager works. Two examples follow.

**pm2:**

```bash
pm2 start npm --name nfba -- run prod
pm2 save       # remember the process list
pm2 startup    # start pm2 at boot (run the command it prints)
```

pm2 restarts the bot by default. To avoid a fast crash loop, you can add `--restart-delay 5000 --max-restarts 10`.

**systemd** (`/etc/systemd/system/nfba.service`):

```ini
[Unit]
Description=NFBA Discord bot
After=network-online.target mysql.service
Wants=network-online.target

[Service]
Type=simple
User=nfba
WorkingDirectory=/opt/nfba
EnvironmentFile=/opt/nfba/.env.prod
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now nfba
journalctl -u nfba -f    # follow the logs
```

Adjust `User`, `WorkingDirectory` and the path to `node` (`which node`) to your server. Because systemd loads `EnvironmentFile` itself, `ExecStart` runs `node index.js` without `--env-file`.

### Configuration on the server

Prefer setting the variables in the host's configuration (systemd `Environment=`/`EnvironmentFile=`, pm2 ecosystem file, provider secrets) over copying `.env.prod` to the server. The code doesn't change, because it only reads `process.env`. If you do keep a `.env.prod` file on the server, make it readable only by the user that runs the bot (`chmod 600`). Set `NODE_ENV=production`, or leave it unset, so that query logs, which contain user IDs, stay off.

### Deploying a new version

```bash
git pull origin main
npm ci --omit=dev     # exact versions from the lockfile, without ESLint and Prettier
# apply any new migration from sql/migrations/ (see Migrations)
pm2 restart nfba      # or: sudo systemctl restart nfba
```

Check that the server runs Node 22 (`node -v`). After a deployment that changes command definitions, Discord can take up to an hour to show the new commands.

## Project structure

```
config.js                 Reads and validates the environment variables
index.js                  Entry point: client, handlers, process error hooks, login
scheduler.js              Daily birthday job, started when the client is ready
constants.js              Shared constants
commands/<category>/      Slash commands, one file per command (birthday/, utils/)
events/<emitter>/         Discord event listeners
services/                 Business logic (birthdayService.js)
models/                   Data access (birthday.js)
utils/                    Database pool, logger, date helpers, command and event loaders
sql/                      schema.sql and numbered migrations
test/                     Unit tests
```

## Contributors

Sckoco
