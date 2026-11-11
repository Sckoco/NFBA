# 07. Add custom birthday phrases

**Branch:** `07-add-custom-birthday-phrases` · **Commit:** `Add custom birthday phrases`
**Files:** new `commands/birthday/mybirthday.js`, `commands/birthday/birthday.js`, `commands/admin/setup.js`, new `utils/birthdayMessage.js`, new `test/birthdayMessage.test.js`, `models/birthday.js`, `models/settings.js`, `services/birthdayService.js`, `services/settingsService.js`, `sql/schema.sql`, new migration in `sql/migrations/`, `scheduler.js`, `package.json`, `package-lock.json`, `README.md`, `CLAUDE.md`
**Depends on:** tasks 03, 04 and 05

## Problem

Every member gets the same birthday message. Members should be able to write their own message, without staff having to approve each one or maintain a list of banned words, and without the bot publishing insults or spam.

## Task

Control works in two layers: an automatic word check refuses bad words immediately, and every accepted message is posted in a staff channel so staff can remove it afterwards. There is no approval step and no word list to maintain.

**Storage**

- Add a nullable `custom_message VARCHAR(200)` to `birthdays`, so removing a birthday also removes its message.
- Add a nullable `alert_channel_id` to `settings`.
- Update `sql/schema.sql` and add the next numbered migration.

**Member command: `/mybirthday` (new top-level command, open to every member)**

It cannot be a `/birthday` subcommand, because `/birthday` is admin-only for the whole command.

- `/mybirthday message text` sets or replaces the member's own message.
- `/mybirthday clearmessage` removes it.
- `/mybirthday view` shows the member's registered date and message.
- All replies are ephemeral. The command only ever acts on the member who runs it.
- Setting a message requires a registered birthday.
- If no alert channel is configured, `/mybirthday message` is refused, because accepted messages would go unseen.
- Call `deferReply` first, as the command makes more than one database query.

**Validation (`utils/birthdayMessage.js`, pure functions with unit tests)**

- Trim the text and replace line breaks with spaces. Refuse more than 200 characters.
- Refuse mentions (`@everyone`, `@here`, `<@...>`, `<@&...>`, `<#...>`) and links (`http://`, `https://`, `discord.gg`).
- Check for bad words with `leo-profanity`, its English dictionary extended with the array exported by `french-badwords-list`. Add both as dependencies. Words are stored in neither the database nor the repository.
- Run the check on the text as written and again with accents removed and in lower case.
- Whole words only, so a bad word inside a longer innocent word is accepted.
- If a list entry turns out to refuse a common word, remove that entry in this file with `filter.remove`.
- Refusals give the reason without quoting the matched word. The check can be bypassed with creative spelling, which is why the alert exists.

**Staff tools**

- `/setup alertchannel [channel]` sets the staff channel, with the same checks as the other channels. `/setup view` shows it.
- `/birthday clearmessage target` lets an admin remove a member's message.

**Alert**

- On each accepted creation or change, post in the alert channel: the member, the old message if any, the new message, and a reminder of `/birthday clearmessage`. Send it with `allowedMentions: { parse: [] }`.
- If the alert cannot be sent, keep the message and log the error.
- Clearing a message sends no alert.

**Announcement (`scheduler.js`)**

- When a member has a message, it replaces the default sentence under the title, and the line naming the member stays. Without a message the announcement is unchanged.

**Documentation**

- Update `README.md` and CLAUDE.md: project structure, main libraries, data layer, what tests cover, and add the content of custom messages to the **Never logged** list.

## Done when

- A member can set, view, replace and clear their own message, and it appears in the next announcement.
- French and English bad words, with or without accents, mentions, links and text over 200 characters are refused, and a message containing a bad word only as part of a longer word is accepted.
- Each accepted message or change appears in the alert channel, without pinging anyone.
- An admin can clear a member's message, and removing a birthday removes its message.
- No log line contains a custom message.
- The migration upgrades an existing database and `sql/schema.sql` creates a fresh one.
- `npm test`, `npm run lint` and `npm run format:check` pass.
