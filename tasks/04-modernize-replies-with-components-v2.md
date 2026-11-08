# 04. Modernize the replies and the announcement with Components V2

**Branch:** `04-modernize-replies-with-components-v2` · **Commit:** `Move the replies and the announcement to Components V2`
**Files:** new `utils/Reply.js`, `commands/birthday/birthday.js`, `commands/utils/help.js`, `commands/utils/ping.js`, `events/client/interactionCreate.js`, `scheduler.js`, `CLAUDE.md`
**Depends on:** task 03

## Problem

Replies are built by hand in each command, so they are not consistent: `/help` uses a custom color and a `makefile` code block, refusals are plain text, and the embeds repeat the same footer and error wording in every branch. The daily announcement is a basic embed with a small thumbnail.

## Task

**Shared builder (`utils/Reply.js`)**

- Add helpers that build every reply in one layout with Components V2 (discord.js 14.28 supports them): a `ContainerBuilder` with an accent color, a title, the body as `TextDisplayBuilder`, and a small last line (`-#`) with the invoking user and a Discord timestamp (`<t:...:f>`), since Components V2 has no footer or timestamp field.
- Provide one helper per kind: success (green, ✅), warning (yellow), error (red, ❌), information. The generic French database error text lives in one place.
- Each helper returns a complete payload, with `flags: MessageFlags.IsComponentsV2` (plus `Ephemeral` when requested) and `allowedMentions: { parse: [] }`.

**Replies**

- Move every reply of `/birthday`, `/help` and `/ping` to these helpers, with no change to which replies are public or ephemeral.
- Move the refusals and the fallback error of `interactionCreate.js` to these helpers.
- Rewrite the `/help` detail view without the `makefile` code block.
- `/birthday view` pagination: put the page buttons inside the message's components and show the page number in the last line. Lower the page limit from the embed limit (4096) to fit Components V2's limit of 4000 characters of text for the whole message, title and last line included.

**Components V2 constraints**

- A message with this flag cannot have `content` or `embeds`, and text mentions ping unless `allowedMentions` blocks them. Embeds never pinged, so the helpers keep today's silent behaviour.
- Editing replaces the whole component tree, so the collector's `end` handler must resend the full page with disabled buttons, not only the button row.

**Announcement (`scheduler.js`)**

- Redesign the daily message with Components V2: accent color, the member's name and avatar, the birthday text, and the GIF from `BIRTHDAY_GIF_URL` shown larger in a `MediaGalleryBuilder`.
- The member is displayed with `<@id>` and is not pinged, as today.

**Documentation**

- Update the **Replies** convention in CLAUDE.md: use the `utils/Reply.js` helpers instead of `EmbedBuilder`, and add the file to the project structure.

## Done when

- Every command, refusal and error shows the same layout, in the right color, public or ephemeral as before.
- `/birthday view` works after `deferReply`, pages through a long list, and its buttons are disabled after the timeout with the page still visible.
- No reply and no announcement pings anyone.
- The announcement's look has been validated on a real test message.
- `npm test`, `npm run lint` and `npm run format:check` pass.
