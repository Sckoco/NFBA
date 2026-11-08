# 02. Add production logs for observability

**Branch:** `02-add-production-logs-for-observability` · **Commit:** `Add production logs for observability`
**Files:** `events/client/interactionCreate.js`, `events/client/ready.js`, new files in `events/client/`, `scheduler.js`, `index.js`, `services/birthdayService.js`, `CLAUDE.md`

## Problem

In production, the logs say little about what the bot is doing. Most of what happens leaves no trace:

- **Commands:** nothing is logged when a command is run. Only the three write commands leave a line, from the service, and only for the result. Commands refused by the checks in `interactionCreate.js` (unknown command, outside a guild, owner only, missing permissions) are silent.
- **Daily announcement:** `runBirthdayAnnouncement` logs nothing when it starts, when there is no birthday, or when an announcement is sent. A day with no line can mean "no birthday" or "the job never ran". The `.catch(() => null)` on the channel fetch also hides why the fetch failed.
- **Discord connection:** no listener for disconnects, reconnects, or errors, so an outage is invisible. REST rate limits, the likely cause of the `/viewbirthday` timeouts in task 01, are not logged either.
- **Startup:** `ready.js` logs `- ready!` without the bot's name or server count. `client.application.commands.set` is not awaited, so a failure only shows up as an `UNHANDLED REJECTION` with no context. The database pool connects lazily, so a wrong password or a stopped MySQL only appears at the first query.
- **Shutdown:** a `SIGTERM` (`systemctl stop`, a deploy) kills Node without running the `process.on('exit')` handler, so the logs just stop.
- **Errors:** `scheduler.js` and the services log `${err}`, which drops the stack trace.

## Task

Use the existing `utils/Logger.js` tags and add no dependency. Every line below is logged in production, not only in development.

**Commands (`interactionCreate.js`)**

- Log each command before it runs, with `Logger.command`: command name, user (`username - id`) and guild ID.
- Log the end of the command with its duration in ms. Say "finished", not "succeeded": commands catch their own database errors and answer with an embed, so reaching the end doesn't prove it worked. The service's `Logger.error` shows those failures.
- Log each refusal with `Logger.warn`: command name, user (`username - id`) and reason (unknown command, outside a guild, owner only, missing permissions).

**Daily announcement (`scheduler.js`)**

- Log the start of each run with the date it checks, then the number of birthdays found, including 0. This line also proves each day that the job ran.
- Log each announcement sent (user ID).
- Log a summary at the end: sent and failed counts.
- Log the reason when the channel fetch fails, instead of discarding it.

**Discord connection (new files in `events/client/`, `name` from the `Events` enum)**

- `Logger.warn`: `ShardDisconnect` (with the close code), `ShardReconnecting`, `Invalidated`, `Warn`.
- `Logger.error`: `ShardError`, `Error`.
- `Logger.client`: `ShardResume` (with the replayed event count), `GuildCreate` and `GuildDelete` (server name and ID).
- In discord.js 14.28, `ShardDisconnect` only fires when the shard will not reconnect, so a recoverable loss of connection is logged by `ShardReconnecting`. `client.destroy()` also emits `ShardReconnecting`, so the listener stays silent once the client is being destroyed. `Invalidated` is never emitted by this version; its listener is kept for the day it is.
- Do not listen to `Events.Debug`: it is too noisy for production.
- In `index.js`, log REST rate limits with `client.rest.on(RESTEvents.RateLimited, ...)` and `Logger.warn`: route, limit, and wait time.

**Startup and shutdown**

- In `ready.js`, log the bot's tag, the server count and the number of commands loaded.
- Await `client.application.commands.set`, in a `try/catch`. Log the number of commands registered, or the error with its stack. A failure must not stop the scheduler from starting.
- Run `SELECT 1` through `execute` at startup and log whether the database is reachable. On failure, log the error and keep running, as the bot does for any later database error.
- In `index.js`, handle `SIGINT` and `SIGTERM`: log the signal, call `client.destroy()`, then exit with code 0.

**Errors**

- In `scheduler.js` and `services/birthdayService.js`, log `err?.stack ?? err` instead of `${err}`.

**What not to log**

- Never log birthday dates, the content of the `date` option, tokens or passwords. SQL queries stay development-only.
- Log user IDs only where this task asks for them: the command and refusal lines (with the username, as the services already do) and the announcement lines (ID only).

**Documentation**

- Update CLAUDE.md: the **Logging** convention (what is logged in production and what must never be), the list of files in `events/client/`, and the startup and shutdown description in **Architecture**.

## Done when

- With the bot running locally and `NODE_ENV` set to anything but `development`, the logs show: startup (tag, servers, commands registered, database reachable), each command with its duration, each kind of refusal, and a clean stop on Ctrl+C.
- A scheduled run with no birthday and a run with at least one birthday each log their start, count and summary.
- Cutting the network briefly logs the loss of connection (`ShardReconnecting`) and the resume (`ShardResume`).
- No log line contains a birthday date.
- `npm test`, `npm run lint` and `npm run format:check` pass.
