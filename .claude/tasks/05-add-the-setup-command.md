# 05. Add the `/setup` command

**Branch:** `05-add-the-setup-command` · **Commit:** `Add the setup command`
**Files:** new `commands/admin/setup.js`, new `services/settingsService.js`, new `models/settings.js`, `models/index.js`, `sql/schema.sql`, new migration in `sql/migrations/`, `config.js`, `.env.example`, `events/client/interactionCreate.js`, `scheduler.js`, `README.md`, `CLAUDE.md`
**Depends on:** task 04 (replies use `utils/Reply.js`)

## Problem

The announcement channel can only be changed in the env file, with a restart. Commands can be used in any channel, and nothing lets a server admin configure the bot from Discord.

## Task

The bot stays single-server: one birthday list and one row of settings.

**Server scope**

- Add a required `GUILD_ID` setting (Discord ID) to `config.js` and `.env.example`.
- `/setup` is refused outside that server. Without this, an admin of any other server the bot joins could change the settings.

**Storage**

- Add a `settings` table holding a single row (`id TINYINT PRIMARY KEY`, `CHECK (id = 1)`) with nullable `commands_channel_id` and `birthday_channel_id`. Update `sql/schema.sql` and add the next numbered migration.
- `models/settings.js` reads the row and saves all columns at once with `INSERT ... ON DUPLICATE KEY UPDATE`. Saving all columns avoids building a query from a column name.
- `services/settingsService.js` keeps the settings in memory, loads them on first use and replaces them on save. If the load fails, log the error and behave as if nothing is configured.

**Command (`commands/admin/setup.js`, `Administrator` only, guild only)**

- `/setup view` shows the current settings (ephemeral).
- `/setup commandchannel [channel]` sets the only channel where commands are accepted.
- `/setup announcementchannel [channel]` sets the channel for birthday messages.
- For both, the `channel` option is limited to text and announcement channels, and leaving it out clears the setting.
- Before saving a channel, check with `guild.members.fetchMe()` that the bot can view it and send messages there. Refuse with a clear message otherwise.
- `SCHEDULE_TIME` and the timezone stay in the env file: changing them needs the cron job to be rescheduled, which is out of scope.

**Using the settings**

- In `interactionCreate.js`, after the permission checks: if a command channel is set and the interaction comes from another channel, refuse it with an ephemeral message naming the right channel, and log the refusal (`wrong channel`).
- Only `/setup` is exempt, so a deleted channel can never lock the bot. Admins are not exempt, because every `/birthday` subcommand is admin-only and the restriction would otherwise cover almost nothing.
- `scheduler.js` uses `birthday_channel_id`, falling back to `config.birthdayChannelId` when it is not set. The bot therefore keeps announcing after deployment, before anyone runs `/setup`.

**Documentation**

- Update `README.md` and CLAUDE.md (project structure, environment variables, interaction flow, daily announcement).

## Done when

- `/setup` saves each setting, `/setup view` shows it, and the values survive a restart.
- With a command channel set, `/help` and `/birthday` are refused elsewhere and work there, and `/setup` works everywhere.
- Clearing a setting restores the default behaviour.
- A channel the bot cannot write to is refused.
- The announcement goes to the configured channel, or to `BIRTHDAY_CHANNEL_ID` when none is configured.
- The migration upgrades an existing database and `sql/schema.sql` creates a fresh one.
- `npm test`, `npm run lint` and `npm run format:check` pass.
