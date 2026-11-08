# 06. Add the automatic birthday role

**Branch:** `06-add-the-automatic-birthday-role` · **Commit:** `Add the automatic birthday role`
**Files:** `commands/admin/setup.js`, `services/settingsService.js`, `models/settings.js`, new `models/birthdayRoleHolder.js`, `models/index.js`, `services/birthdayService.js`, `sql/schema.sql`, new migration in `sql/migrations/`, `scheduler.js`, `README.md`, `CLAUDE.md`
**Depends on:** task 05

## Problem

Nothing marks a member as celebrating their birthday outside the announcement message. The bot should give a configured role on the member's birthday and remove it afterwards.

## Task

**Configuration**

- Add a nullable `birthday_role_id` to `settings`, and `/setup role [role]` to set it (leaving the option out clears it, which turns the feature off). `/setup view` shows it.
- Refuse `@everyone`, managed roles and any role at or above the bot's highest role, and refuse if the bot lacks `ManageRoles`. Each refusal explains what to fix.

**Who holds the role**

- Add a `birthday_role_holders(user_id, role_id)` table, primary key on both columns, in `sql/schema.sql` and the next numbered migration.
- The table is needed because the bot only has the `Guilds` intent: `role.members` is not filled and listing all members would need the privileged `GuildMembers` intent. Do not add it. `guild.members.fetch(userId)` for one member works through REST without it.
- Storing `role_id` lets the bot remove the right role even if `/setup role` changed it in the meantime.

**Daily run (`scheduler.js`)**

- First, for every holder, remove the stored role and delete the row. Do this before the "0 birthdays" early return, so the role is removed on days with no birthday. The role therefore lasts until the next daily run.
- Delete the row only if the removal worked, or if the member or role no longer exists (Discord errors `10007` and `10011`). On any other error, keep the row so the next run retries.
- Then, if a role is configured, for each birthday from `getBirthdaysCelebratedOn` (so the 29/02 rule applies): insert the holder row first, then add the role. Inserting first means a crash cannot leave a role nobody will remove.
- Members who left the server are skipped. They still get the announcement.
- A role failure for one member must not stop the others and must not stop that member's announcement.
- Log the number of roles removed, added and failed. Role lines carry the user ID only, never a date.

**Documentation**

- Update `README.md` (the bot needs the `Manage Roles` permission, and its role must be above the birthday role) and CLAUDE.md (daily announcement, logging).

## Done when

- A member with a birthday gets the role at the daily run and loses it at the next run, including when no one has a birthday that day.
- A bot restart between the two runs does not leave the role behind.
- A member who left the server, or a deleted role, does not make the run fail and does not block the announcements.
- With no role configured, the announcement works as before.
- The migration upgrades an existing database and `sql/schema.sql` creates a fresh one.
- `npm test`, `npm run lint` and `npm run format:check` pass.
