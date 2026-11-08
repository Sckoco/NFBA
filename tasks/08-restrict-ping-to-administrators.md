# 08. Restrict `/ping` to administrators

**Branch:** `08-restrict-ping-to-administrators` · **Commit:** `Restrict ping to administrators`
**Files:** `commands/utils/ping.js`, `README.md`

## Problem

`/ping` only requires `SendMessages`, so every member can run it and see it in Discord's command menu. It is a diagnostic command with no use for regular members.

## Task

- In `commands/utils/ping.js`, set `permissions` to `[PermissionFlagsBits.Administrator]`, so `interactionCreate.js` refuses other members.
- Add `default_member_permissions: PermissionFlagsBits.Administrator`, as the birthday commands do, so Discord hides the command from other members.
- In `README.md`, change the access of `/ping` from Everyone to administrators.

## Done when

- An administrator can run `/ping` and gets the latency.
- A member without `Administrator` does not see `/ping` in Discord's menu, and is refused with the missing permissions message if the interaction still reaches the bot.
- `npm test`, `npm run lint` and `npm run format:check` pass.
