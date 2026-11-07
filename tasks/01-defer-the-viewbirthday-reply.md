# 01. Defer the `/viewbirthday` reply

**Branch:** `<issue-number>-defer-the-viewbirthday-reply` · **Commit:** `Defer the viewbirthday reply`
**Files:** `commands/birthday/viewbirthday.js`

## Problem

In production (2.0.0), `/viewbirthday` without a member fails with `DiscordAPIError[10062]: Unknown interaction`, and the error message sent by `interactionCreate.js` fails with the same error:

```
[ERROR] Error while running command 'viewbirthday':
DiscordAPIError[10062]: Unknown interaction
    at async ChatInputCommandInteraction.reply (.../InteractionResponses.js:193:22)
[ERROR] Could not send the error message for 'viewbirthday':
DiscordAPIError[10062]: Unknown interaction
```

Discord gives a bot **3 seconds** to answer an interaction. Without a member, the command reads every birthday and then calls `client.users.fetch` for each stored user before its first reply. The bot only uses the `Guilds` intent, so right after a start the user cache is empty: that is one API request per birthday, and Discord rate-limits them. With a few dozen birthdays, the reply comes after the 3 seconds and the interaction has already expired.

The command never calls `deferReply`, so it never tells Discord that the answer is coming.

## Task

- Call `await interaction.deferReply()` at the start of `runInteraction`, before any database or API call. Not ephemeral: the replies of this command are public today, keep them public.
- Replace every `interaction.reply(...)` of the command with `interaction.editReply(...)`: the empty list, the single page, the member lookup, the "no birthday" case and the error embed in the `catch`.
- In `replyWithPages`, send the first page with `editReply`. `editReply` returns the `Message` directly, so drop `withResponse: true` and `response.resource.message` and create the button collector on the returned message.
- Leave the button handlers as they are: `button.reply` and `button.update` answer the button interactions, which get their own 3 seconds.
- No change to `interactionCreate.js`: its `reply` helper already uses `followUp` when the interaction is deferred.
- Update the **Replies** convention in CLAUDE.md: a command that calls the Discord API or makes more than one database query before answering must call `deferReply` first and answer with `editReply`.

## Done when

- `/viewbirthday` lists every birthday right after a bot restart (empty cache), with page buttons if the list is long.
- `/viewbirthday @member`, the empty list and the database error still show the right embed.
- `npm test`, `npm run lint` and `npm run format:check` pass.
- Released as `2.0.1` (`npm version 2.0.1 --no-git-tag-version`, PR `dev` → `main`, tag `2.0.1`) and deployed to the VPS.
