# 03. Rename the birthday commands to `/birthday` subcommands

**Branch:** `03-rename-the-birthday-commands` · **Commit:** `Rename the birthday commands to birthday subcommands`
**Files:** new `commands/birthday/birthday.js`, removed `commands/birthday/addbirthday.js`, `modifybirthday.js`, `removebirthday.js`, `viewbirthday.js`, `events/client/interactionCreate.js`, `README.md`, `CLAUDE.md`

## Problem

The four birthday commands are separate top-level commands with long names (`/addbirthday`, `/modifybirthday`, `/removebirthday`, `/viewbirthday`). They fill Discord's command menu and share the same permissions, so they are really one command with four actions.

## Task

Replace the four commands with one `/birthday` command:

| Before            | After              | Options                                |
| ----------------- | ------------------ | -------------------------------------- |
| `/addbirthday`    | `/birthday add`    | `target` (required), `date` (required) |
| `/modifybirthday` | `/birthday edit`   | `target` (required), `date` (required) |
| `/removebirthday` | `/birthday remove` | `target` (required)                    |
| `/viewbirthday`   | `/birthday view`   | `target` (optional)                    |

- `/help` and `/ping` keep their names.
- Create `commands/birthday/birthday.js` with `name: 'birthday'`, `category: 'birthday'`, the four subcommands in `options` (`ApplicationCommandOptionType.Subcommand`), and a `runInteraction` that dispatches on `interaction.options.getSubcommand()`. Move the existing behaviour without changing it, including the `deferReply` of `view`, its pagination and its replies.
- Keep the `Administrator` permission, `default_member_permissions` and the guild-only `contexts`. Discord applies them to the whole command, so all four subcommands stay admin-only.
- Fill `usage` and `examples` so `/help birthday` documents the subcommands, using the `{}` notation `/help` already explains.
- Update the text that names an old command: the "already registered" reply must mention `/birthday edit`. Rename the page button IDs to `birthday:previous` and `birthday:next`.
- In `interactionCreate.js`, include the subcommand in the command and refusal log lines (`/birthday add (...)`), so the logs keep saying which action ran. Never log option values.
- The old commands disappear by themselves: `client.application.commands.set` replaces the whole list on `clientReady`. Propagation can take up to an hour.
- Update `README.md` and `CLAUDE.md` (project structure, command names).

## Done when

- `/birthday add`, `edit`, `remove` and `view` behave as the four old commands did, including the invalid date, duplicate, not found and database error replies.
- `/help` lists `birthday`, and `/help birthday` shows the four subcommands.
- The old commands are gone from Discord's menu after registration.
- The logs show the subcommand name.
- `npm test`, `npm run lint` and `npm run format:check` pass.
