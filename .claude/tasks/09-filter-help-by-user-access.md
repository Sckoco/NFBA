# 09. Show only the commands a user can run in `/help`

**Branch:** `09-filter-help-by-user-access` · **Commit:** `Show only available commands in help`
**Files:** `commands/utils/help.js`, `README.md`, `CLAUDE.md`

## Problem

`/help` lists every loaded command to everyone, including commands the user would be refused, such as the administrator commands. `/help <command>` also shows the details of those commands.

## Task

- In `commands/utils/help.js`, keep only the commands available to the invoking user, using the same two rules as `interactionCreate.js`:
  - an `ownerOnly` command is available only if `interaction.user.id` is `config.ownerId`;
  - the member must have every permission in `cmd.permissions`, checked with `interaction.memberPermissions.has(cmd.permissions)`.
- Build the categories from the filtered commands, so a category with no available command is not shown.
- `/help <command>` on a command the user cannot run gives the same reply as an unknown command, so it does not reveal that the command exists.
- `/help` itself stays open to everyone.
- In `README.md` and CLAUDE.md, say that `/help` only shows the commands the user can run.

## Done when

- A regular member only sees the commands they can run, with no empty category.
- An administrator sees the administrator commands, and owner-only commands stay hidden unless the user is the bot owner.
- `/help <command>` shows the details of an available command, and answers "Cette commande n'existe pas" for one the user cannot run.
- `npm test`, `npm run lint` and `npm run format:check` pass.
