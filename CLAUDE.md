# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

## Repo overview

NFBA is a Discord bot that stores server members' birthdays and posts a message in a channel on each member's birthday.

- **Runtime:** Node.js 22 (`engines.node: 22.x`), CommonJS modules.
- **Main libraries:** discord.js v14 (slash commands), mysql2 (MySQL connection pool), node-cron (daily birthday check), dayjs, chalk v4 (logging).
- **Language:** users see French text (replies, embeds, command descriptions). Code, comments and logs are in English.
- **Tasks:** [TASKS.md](TASKS.md) lists every task with its state (Todo or Done) and a link to its details in `tasks/<NN>-<slug>.md`. TASKS.md holds only the number, the linked title, the state, the date the task was added and the date it was done (`YYYY-MM-DD`); everything else goes in the task file. Before changing code, check whether a task already covers the change, and stay inside the scope of the current task. A new task gets the next number, a new file in `tasks/` and a row in TASKS.md with today's date as Added. Finished task files are kept. See **Git** under Coding conventions for how a task is delivered.
- **Keep this file current:** whenever a code change makes something in CLAUDE.md wrong or no longer relevant (file layout, commands, architecture, conventions, known issues), update CLAUDE.md in the same change, even if CLAUDE.md is not in the task's file list. Remove what no longer applies rather than leaving it stale.

## Project structure

```
config.js                 Reads and validates env variables, exports a frozen config
index.js                  Entry point: client setup, handlers, process error hooks, login
scheduler.js              Daily birthday cron job, started from the clientReady handler
constants.js              Shared constants (birthday GIF URL)
commands/<category>/*.js  Slash commands, one file per command; the folder name is the category
  birthday/               addbirthday, modifybirthday, removebirthday, viewbirthday
  utils/                  help, ping
events/<emitter>/*.js     Discord event listeners. client/: ready, interactionCreate; logging only: shardDisconnect,
                          shardReconnecting, shardResume, shardError, invalidated, warn, error, guildCreate, guildDelete
services/                 Business logic as plain exported functions (birthdayService.js)
models/                   Data access classes (birthday.js) and their re-export (index.js)
utils/
  Database.js             mysql2/promise pool and execute(sql, params), the single entry point for queries
  Logger.js               Colored, timestamped console logger
  QueryUtils.js           formatString(sql, params): fills the `?` placeholders, for logging queries only
  date.js                 parseBirthday(input) validates D/M or DD/MM (29/02 allowed); formatBirthday() gives DD/MM;
                          birthdaysCelebratedOn(date) applies the 29/02 rule
  handlers/
    CommandUtil.js        Loads and validates commands/<category>/*.js into client.commands
    EventUtil.js          Loads events/<emitter>/*.js and registers them on the client
sql/
  schema.sql              Full schema for a fresh database
  migrations/             Numbered migrations for existing databases (001_day_month.sql)
test/*.test.js            Unit tests (node:test), run with npm test
img/                      Bot logo
TASKS.md                  Task list with states; details in tasks/<NN>-<slug>.md
.github/workflows/ci.yml  CI: npm ci + npm run lint + npm test on PRs to dev and main
```

## Commands

```bash
npm ci                 # install the exact versions from package-lock.json
npm start              # node --env-file=.env.dev index.js
npm run prod           # node --env-file=.env.prod index.js
npm test               # node --test: runs test/*.test.js (no extra dependency)
npm run lint           # ESLint (flat config in eslint.config.js)
npm run format         # Prettier, rewrites files
npm run format:check   # Prettier, check only
```

Tests cover pure helpers only (`utils/date.js`); there are no tests that need Discord or the database. Before you commit, run `npm test`, `npm run lint` and `npm run format:check`.

**Environment:** the npm scripts load `.env.dev` / `.env.prod` with Node's `--env-file` (both git-ignored, as is `.env`). [config.js](config.js) validates the variables at startup and exits listing every missing or invalid one; code reads settings from `config`, never from `process.env` directly. The tracked template is `.env.example`: `DISCORD_TOKEN`, `OWNER_ID`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `BIRTHDAY_CHANNEL_ID`, `SCHEDULE_TIME` (a cron expression), optional `TIMEZONE` (default `Europe/Brussels`), `NODE_ENV` (`development` in `.env.dev` enables query logs, `config.isDevelopment`; anything else, including unset, disables them). Never put real values in `.env.example`.

## Architecture

**Startup ([index.js](index.js)):** loads `config`, creates the `Client` with only the `Guilds` intent (interactions and the REST fetches of users and channels need nothing more; add an intent only when a feature requires it), creates `client.commands` (a `Collection`), runs the `CommandUtil` and `EventUtil` handlers (synchronously, so they finish before login), sets up the REST rate-limit log and the `process` handlers, and logs in. An `uncaughtException` is logged and then exits with code 1, relying on a process manager (pm2, systemd, Docker) to restart the bot; an `unhandledRejection` is logged with its stack trace and the bot keeps running. The `clientReady` handler ([events/client/ready.js](events/client/ready.js)) logs the bot's tag, server count and loaded commands, registers the commands, checks the database with `SELECT 1`, then starts the daily cron job ([scheduler.js](scheduler.js)). A failed registration or database check is logged and doesn't stop the scheduler from starting.

**Shutdown ([index.js](index.js)):** on `SIGINT` or `SIGTERM`, the signal is logged, `client.destroy()` runs and the process exits with code 0. A second identical signal kills the process through Node's default handler.

**Commands:** `CommandUtil` reads `commands/<category>/*.js` (paths resolved from `__dirname`, so the bot starts from any working directory) and only loads a command if it exports all of these fields, logging a warning otherwise. A file that fails to `require` is logged and skipped:

```js
module.exports = {
  name, description, category, permissions /* array */, ownerOnly /* boolean */,
  usage, examples /* array */, options /* optional, discord.js option objects */,
  async runInteraction(client, interaction) { ... },
};
```

On `clientReady`, the whole `client.commands` collection is registered as **global** slash commands (`client.application.commands.set`), which can take up to an hour to propagate.

**Events:** `EventUtil` reads `events/<emitter>/*.js`. Each file exports `{ name, once, execute(client, ...args) }`, and `name` must be a discord.js event name, i.e. a value of `Events` (use the constant, e.g. `name: Events.ClientReady`). Invalid files are logged and skipped.

**Interaction flow ([events/client/interactionCreate.js](events/client/interactionCreate.js)):** finds the command → rejects interactions outside a guild → checks `ownerOnly` against `config.ownerId` → checks the member's `permissions` (`PermissionFlagsBits` values) → calls `cmd.runInteraction(client, interaction)`. Any error is caught and answered with an ephemeral message (`reply` or `followUp`).

**Data layer:** commands and the scheduler import the functions of [services/birthdayService.js](services/birthdayService.js) directly (business logic is never attached to `client`). These functions log the result and call the static methods of the `Birthday` model ([models/birthday.js](models/birthday.js)), which call `execute(sql, params)` from [utils/Database.js](utils/Database.js) (`mysql2/promise`, prepared statements). SELECTs return rows (`getMemberBirthday` returns the first row or `undefined`); insert, update and delete return the raw `ResultSetHeader`, so callers can read `affectedRows`. Table `birthdays(user_id PRIMARY KEY, day, month)` (TINYINT, with CHECK constraints), defined in [sql/schema.sql](sql/schema.sql); existing databases are upgraded with the files in [sql/migrations/](sql/migrations/), and any schema change needs both a schema update and a new numbered migration. `/addbirthday` and `/modifybirthday` validate the input with `parseBirthday` ([utils/date.js](utils/date.js)), reply with an ephemeral error if it is invalid, and pass the parsed `{ day, month }` to the service; `formatBirthday(row)` turns a row back into `DD/MM` for display. `getAllBirthdays` sorts in SQL (`ORDER BY month, day`). `createBirthday` inserts without checking first and relies on the primary key: it catches `ER_DUP_ENTRY` and returns `false` (`true` when created), so concurrent `/addbirthday` calls cannot create duplicates. `updateBirthday` and `removeBirthday` return `false` when `affectedRows` is 0 (no birthday registered for that user), so the commands can say so; mysql2 enables `FOUND_ROWS` by default, so an update to the same date still counts as found. Commands take the target with `options.getUser` (a `User`, not a `GuildMember`), so users who left the server still work. `execute` logs every query through `Logger.database` in development only, because the values contain user IDs; never call `pool` directly.

**Daily announcement ([scheduler.js](scheduler.js)):** `node-cron` runs at `SCHEDULE_TIME` in `config.timezone`. It computes today's date in the same timezone and looks up the birthdays to celebrate with `getBirthdaysCelebratedOn` (in non-leap years, 29/02 birthdays are celebrated on 28/02), fetches the channel and each user, and sends an embed to `BIRTHDAY_CHANNEL_ID` for each one; a failure for one birthday doesn't stop the others.

## Coding conventions

- **Formatting:** Prettier is the source of truth: single quotes, semicolons, no trailing commas, 2-space indent, 120-character lines. Do not format by hand, and never mix formatting changes with logic changes in one commit.
- **Linting:** ESLint `recommended` + `eslint-config-prettier` (keep it last in the config). All recommended rules are errors, so `npm run lint` fails on any finding.
- **Modules:** CommonJS (`require` / `module.exports`), not ESM.
- **Naming:** camelCase for variables and functions, PascalCase for classes and for files in `utils/` (`Logger.js`, `CommandUtil.js`). Command `name` values are lowercase with no separators (`addbirthday`).
- **New command:** add a file under `commands/<category>/` with every required field listed above. Set `category` to the folder name: `/help` groups the loaded commands by their `category` field, so a mismatch shows the command under the wrong heading.
- **New event:** add a file under `events/<emitter>/` and set its `name` from the discord.js `Events` enum.
- **Replies:** for ephemeral replies use `flags: MessageFlags.Ephemeral` (not `ephemeral: true`); to read the sent message use `withResponse: true` and `response.resource.message` (not `fetchReply`). Discord allows 3 seconds for the first answer, so a command that calls the Discord API or makes more than one database query before answering must call `deferReply` first and answer with `editReply` (which returns the `Message` directly). Use an `EmbedBuilder` with `.setTimestamp()` and a footer showing the invoking user. Colors: `Green` for success (✅), `Yellow` for warnings, `Red` for errors (❌). Wrap database calls in `try/catch` and reply with a generic French error embed when they fail.
- **Logging:** use `utils/Logger.js` (`client`, `command`, `event`, `database`, `warn`, `error`, `typo`), not `console.log`. Log errors with `err?.stack ?? err`, not `${err}`.
  - Logged in production: each command's start and end with its duration ("finished", not "succeeded", because commands catch their own database errors), each refusal with its reason, each daily run (date checked, birthdays found, announcements sent, sent and failed counts), Discord connection events, REST rate limits, startup and shutdown.
  - Never logged: birthday dates, the content of the `date` option, tokens, passwords. SQL queries are development-only. Don't listen to `Events.Debug`, which is too noisy for production.
  - User IDs appear only in the service result lines, the command and refusal lines (with the username) and the announcement lines (ID only).
- **SQL:** always use `?` placeholders with a values array. Never build query strings by concatenation.
- **Config:** add new settings to `config.js` and read them from `config`. Do not hard-code IDs or secrets.
- **Git:**
  - - A new task (its file and its TASKS.md row) goes in a commit of its own, directly on `dev`, with the message `Add task <NN>`.
  - Each task is one branch from `dev` and one PR into `dev`. The branch is named `<NN>-<slug>` with the task number, not a GitHub issue number (for example `02-add-production-logs-for-observability`); tasks don't use GitHub issues.
  - The branch can have as many commits as needed. If the plan changes, update the task file on the branch so it describes what was really done.
  - Before opening the PR, set the task to Done in TASKS.md and fill in the Done date, so merging the PR is what completes the task. The PR description links the task file.
  - PRs into `dev` are **squash-merged**, with the `Commit` title from the task file as the message, so each task is one commit on `dev`.
  - For a release, `dev` is merged into `main` with a **regular merge commit** (never a squash, or the two branches diverge), then `main` is tagged.
