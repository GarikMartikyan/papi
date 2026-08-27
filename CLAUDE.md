# papi

The base project for admin panels: the core lives in `lib/`, the panel in `src/`. Panels are
clones of this repository, and the core reaches them through `git merge upstream/main`.

## `lib/` is read-only in panels

Work out where you are before touching the core. There are two signs, and either one is enough:

- an `upstream` remote exists **or** `name` in `package.json` is not `papi` — this is a panel.
  **Do not touch `lib/`.** An edit there turns into a conflict on the very next core update. The
  change belongs in the papi repository instead. Until it lands, look for a solution on the panel
  side: almost everything in the core is configurable through props and config.
- no `upstream` remote and `name` is `papi` — this is papi itself. The core is edited here.

Two signs rather than one: remotes live in `.git/config` and are not carried over by a clone, so
the panel's second developer will not have `upstream`, while the package name is committed and
survives cloning.

`.githooks/pre-commit` rejects a commit that touches `lib/` in a panel. Bypassing it with
`PAPI_ALLOW_LIB=1` without the user explicitly asking is not allowed.

The root configs — `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `prettier.config.js` —
belong to the core too: editing them in a panel produces a conflict on the first merge. Everything
configurable is exposed through environment variables, so an ordinary panel never needs to touch
them.

## Import boundaries

- The panel sees the core only through barrels: `@papi/components`, `@papi/hooks`, `@papi/store`.
  Deep paths (`@papi/components/layouts/MainLayout/MainLayout`) are forbidden — eslint complains.
- Inside `lib/` imports are relative. The `@papi/*` alias is not used there.
- The core does not depend on the panel: importing anything from `src/` into `lib/` is never
  acceptable.

A new public entity of the core is added to the barrel of its own folder (`lib/<folder>/index.ts`)
— it needs no other registration, the alias and resolution work on the folder as a whole.

## File structure

A new file mirrors what already sits next to it: location, name, internal order. Do not introduce
your own approach where the repository already has one — even if yours looks better. If they
disagree, ask first.

- **The core is folders with barrels.** `lib/<folder>/index.ts` exposes everything public.
  Components are split into `components/layouts/` and `components/shared/`; the parts of a
  component live in `elements/` next to their owner and are never exposed.
- **The panel is flat, no barrels.** `src/api/<resource>.api.ts`, `src/pages/<Page>/<Page>.tsx`,
  `src/store/slices/<name>.slice.ts`. There is not a single `index.ts` under `src/`, and none
  should be added.
- **File names are `<entity>.<role>.ts`**, with the role taken from the neighbours in the same
  folder: `.api`, `.slice`, `.service`, `.util`, `.constants`, `.theme`, `.provider`, `.enum`,
  `.interface`, `.type`. Components and hooks are named after themselves: `UserMenu.tsx`,
  `useAuth.ts`.
- **One file — one component, one hook.** No secondary component at the bottom of a file, however
  small: it gets a file of its own next door.
- **`export default` is not used — only named exports.** `export const UserMenu = () => {}`, never
  `export default UserMenu`. A named export pins one name to the entity across the whole repository:
  grep finds every use, a barrel re-exports it as `export * from './UserMenu'` without listing it by
  hand, and a rename propagates instead of turning into a fresh alias at each import site. The only
  exception is a root config the tool itself requires in that shape — `vite.config.ts`,
  `eslint.config.js`, `prettier.config.js`.
- Types go to `types/`, texts to `i18n/`, values to `constants/`. An entity goes where its peers
  already live, not next to the place that uses it.

## `docs/` holds the PRDs

Product requirement documents live in `docs/` at the repository root — per project area, per page,
and so on. That folder is theirs; nothing else belongs in it.

**A PRD is written by the user, never by you.** Creating a document there, or changing one that is
already there, takes an explicit request naming exactly that. "Write this down" or "we need a spec"
dropped in passing is not one — ask instead of assuming.

When the code and a PRD disagree, **report the mismatch and stop**. Which side is wrong — the
implementation or the document — is the user's call. Do not edit `docs/` to match the code, and do
not rewrite the code to match a document that may itself be out of date.

## Memoization is automatic only

**`useMemo`, `useCallback` and `memo` are not written unless directly asked for.** Not in `lib/`,
not in `src/`, not "where needed", not for callbacks a hook returns. A value is computed in the
body, a callback is declared as a plain function.

Memoization is React Compiler's job — it is enabled in `vite.config.ts` and inserts the cache at
build time, including stable references for functions coming out of hooks. Hand-written
memoization does not improve on it, it duplicates it. Importing any of the three from `react` is
rejected by eslint, so a violation shows up on `npm run lint` rather than in review.

If it is genuinely needed, that is a separate request and a separate `eslint-disable` with an
explanation — not a decision made in passing.

## Verifying the work

```bash
npm run typecheck && npm run lint && npm run build
```

Run it before saying "done", not after being asked whether you checked. The core has no build of
its own — `lib/` compiles together with `src/`, so there is no extra step for a core edit, and the
dev server picks it up immediately.

## Keep answers short

**Answer briefly.** The conclusion, not the road to it: what was done or what is proposed — and
why, if that is not obvious. Retelling the files you read, listing what you checked, walking
through rejected options and summarising at the end are not needed — if asked, expand then.

This is about chat only. Comments in the code stay detailed wherever they explain a decision; this
rule does not touch them.
