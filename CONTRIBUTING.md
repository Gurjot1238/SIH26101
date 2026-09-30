# Contributing to NEXORA AI

This is a Smart India Hackathon 2026 (SIH26101) team project. These notes keep the
codebase consistent for team members and make the build reproducible for reviewers.

## Getting set up

Requirements and the one-command start are in the [README](README.md#quick-start-macos).
In short:

```bash
./start.sh            # installs deps on first run, starts the API + app
```

or run the pieces yourself with `npm install`, `cp server/.env.example server/.env`,
`npm run auth`, and `npm run dev`.

## Before you push

Both of these must pass:

```bash
npm run typecheck                 # tsc --noEmit, whole project
DATABASE_URL='' npm test          # full suite on the JSON backend (no database needed)
```

If you touched a subsystem, run its focused suite too (for example `npm run ai:test`,
`npm run ocr:test`, `npm run vision:test`, `npm run engine:test`). A change is not done
until the suite it affects is green.

## Conventions

- **No fake data paths.** A feature either does the real thing or reports itself
  unavailable. Do not hard-code analytics, AI answers, recommendations, or connection
  statuses. This is a core rule of the product — keep it.
- **Preserve working systems.** Improve existing modules rather than duplicating them;
  don't remove a feature because a requirement got harder.
- **Server owns the truth.** Answer keys, grading, and secrets stay on the server. The
  browser only ever talks to the NEXORA backend.
- **Match the existing style.** The frontend is React 19 + TypeScript; the server is
  standard-library Node `.mjs` with `pg` as the only runtime dependency (database mode
  only). Follow the patterns already in the file you are editing.

## Security

- **Never commit secrets.** `server/.env` is gitignored. Only `server/.env.example`
  (key names, blank values) is tracked. No key, token, or password belongs in source,
  logs, API responses, or the frontend bundle — and nothing secret ever gets a `VITE_`
  prefix.
- If you find a secret in a diff, stop and remove it before committing.

## Commit and PR hygiene

- Keep commits focused and messages descriptive.
- Push to a branch and open a pull request for review rather than committing straight
  to `main`.
