# 10. Migrate the project to TypeScript

**Branch:** `10-migrate-to-typescript` · **Commit:** `Migrate the project to TypeScript`
**Files:** every `.js` file (renamed to `.ts`), new `tsconfig.json`, new `types/command.ts`, new `types/event.ts`, new `types/discord.d.ts`, `package.json`, `package-lock.json`, `eslint.config.js`, `.gitignore`, `.prettierignore`, `.github/workflows/ci.yml`, `README.md`, `CLAUDE.md`

## Problem

The bot is plain JavaScript, so nothing checks the shapes it relies on until it runs:

- A command or event file with a missing or misspelled field is only caught by the runtime checks in `CommandUtil.js` and `EventUtil.js`, when the bot starts.
- `client.commands`, the database rows (`user_id`, `day`, `month`), the `ResultSetHeader` returned by writes and the `config` object have no declared type, so a typo or a wrong field is only found in Discord or in the logs.
- discord.js values that can be `null` (`interaction.member`, `interaction.guild`, a fetched channel) are used without the compiler pointing out the missing checks.

Tasks 03 to 07 add a lot of code (subcommands, `/setup`, the birthday role, custom phrases). Migrating first means that code is written in TypeScript directly instead of being converted later, so this task should be done **before task 03**.

## Task

Convert the whole project to TypeScript in strict mode, with **no change in behaviour**: same commands, replies, logs, schema and environment variables.

**Tooling**

- Add dev dependencies: `typescript`, `@types/node` (22.x), `typescript-eslint`, `tsx`. Pin them like the other dependencies, and commit `package-lock.json`.
- Add `tsconfig.json`: `strict: true`, `target: "ES2023"`, `module` and `moduleResolution: "nodenext"`, `esModuleInterop: true`, `rootDir: "."`, `outDir: "dist"`, `sourceMap: true`, `include` covering the source and `test/`. `package.json` has no `"type"` field, so the compiled output stays CommonJS and the runtime model doesn't change.
- Scripts:
  ```
  build          tsc
  typecheck      tsc --noEmit
  start          tsx --env-file=.env.dev index.ts
  prod           node --env-file=.env.prod dist/index.js
  test           tsx --test test/*.test.ts
  lint, format, format:check   unchanged
  ```
  Production runs the compiled `dist/`, not `tsx`. Set `"main": "dist/index.js"`.
- Add `dist/` to `.gitignore`, `.prettierignore` and the ESLint ignores.
- Do not rely on Node 22's built-in type stripping: it doesn't check types, doesn't support enums and needs `.ts` extensions in imports.

**Code**

- Rename each `.js` file to `.ts` with `git mv`, in a commit of its own with no content change, so git keeps the file history. Make the content changes in later commits.
- Replace `require` / `module.exports` with `import` / `export`. Use `import type` for imports used only as types.
- `types/command.ts`: a `Command` interface with the fields `CommandUtil` requires today (`name`, `description`, `category`, `permissions: bigint[]`, `ownerOnly`, `usage`, `examples: string[]`, optional `options: ApplicationCommandOptionData[]`, `runInteraction(client, interaction: ChatInputCommandInteraction): Promise<void>`), plus the fields some commands already set (`type`, `default_member_permissions`, `contexts`). Each command file does `export default { ... } satisfies Command`.
- `types/event.ts`: a generic `Event<K extends keyof ClientEvents>` with `name: K`, `once?: boolean` and `execute(client: Client, ...args: ClientEvents[K])`, so each event's arguments are typed from its name. Each event file does `export default { ... } satisfies Event<Events.X>`.
- `types/discord.d.ts`: declare `client.commands` with module augmentation, because discord.js's `Client` type has no such property:
  ```ts
  declare module 'discord.js' {
    interface Client {
      commands: Collection<string, Command>;
    }
  }
  ```
  In `index.ts`, replace the `['commands'].forEach(...)` loop with `client.commands = new Collection()`.
- `CommandUtil` and `EventUtil`: load `.ts` files when running under `tsx` and `.js` files from `dist/` (match the extension of the loader's own file, `path.extname(__filename)`), and read `mod.default`. Skip `.d.ts` files. Keep the runtime checks that the compiler can't guarantee for dynamically loaded files: the file exports an object, `name` is set, permissions are `PermissionFlagsBits` values, event names are `Events` values. Keep the existing log messages.
- `utils/Database.ts`: make `execute` generic, `execute<T extends RowDataPacket[] | ResultSetHeader>(sql, params)`, and type `params`.
- `models/birthday.ts`: a `BirthdayRow` interface (`user_id: string`, `day: number`, `month: number`) extending `RowDataPacket`. Type every static method's return value: rows for SELECTs, `ResultSetHeader` for writes. `services/birthdayService.ts` keeps its return values (`false` / `true`, rows, `undefined`) with explicit types.
- `config.ts`: export a `Config` type and keep the frozen object.
- `utils/date.ts`: type `parseBirthday` as returning `{ day, month } | null` (or whatever it returns today) and the other helpers accordingly.
- Fix what strict mode reports with the smallest change that keeps the current behaviour (null checks on `interaction.member`, channel types with `isTextBased()` / `isSendable()`, `catch (err)` being `unknown`). Don't use `any` or non-null assertions (`!`) to silence an error, except where a value is guaranteed and a comment says why.
- `test/date.test.ts`: convert the test file. Tests still need neither Discord nor the database.

**Lint and CI**

- `eslint.config.*`: use `typescript-eslint`'s `recommended` config on `.ts` files, keep `js.configs.recommended` and `globals.node`, set `sourceType` for TypeScript files to `module`, and keep `eslint-config-prettier` last. The config file itself can stay JavaScript.
- `.github/workflows/ci.yml`: add `npm run typecheck` after `npm run lint`, and add `npm run format:check`, which CI doesn't run yet.

**Deployment**

- `tsc` is a dev dependency, but `README.md` deploys with `npm ci --omit=dev`. Change the deployment steps to `npm ci`, `npm run build`, then `npm prune --omit=dev`, and start with `node dist/index.js` (systemd `ExecStart`, pm2 `npm run prod`).

**Documentation**

- `README.md`: requirements, scripts, project structure, adding a command or an event (the `satisfies Command` / `satisfies Event` shape), deployment.
- `CLAUDE.md`: runtime and libraries, project structure (`.ts` files, `types/`, `tsconfig.json`, `dist/`), commands (`build`, `typecheck`), the command and event export shapes, the **Modules** convention (TypeScript with `import`/`export`, compiled to CommonJS), and the pre-commit checks (add `npm run typecheck`).

## Out of scope

- Any change in behaviour, replies, logs, the SQL schema or the environment variables.
- Switching the output to ESM.
- Replacing the runtime checks of the loaders with a schema library.

## Done when

- No `.js` file remains in the source except configuration files that must stay JavaScript.
- `npm run typecheck`, `npm test`, `npm run lint` and `npm run format:check` pass, with `strict: true`.
- `npm start` runs the bot from the `.ts` files, and `npm run build` then `npm run prod` runs it from `dist/`.
- Both ways, every command loads and registers, every event listener is registered, and `/help`, `/ping` and the four birthday commands behave as before, including their error replies.
- The daily announcement still runs (checked with a `SCHEDULE_TIME` set a minute ahead).
- CI runs the type check.
- `README.md` and `CLAUDE.md` describe the TypeScript setup.
