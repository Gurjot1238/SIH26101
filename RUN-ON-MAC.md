# Run StatSkill on your Mac

Everything below assumes you have this `statskill-mac` folder open in VS Code.

## The short version

```bash
cd ~/Documents/SIH26101/statskill-mac
./start.sh
```

Then open the `http://localhost:5173/` link that appears in the terminal.

`./start.sh` checks Node, installs dependencies on the first run, starts the auth
server, and then starts the app. Control-C stops both.

The first install takes a few minutes and downloads about 400 MB. After that,
starting takes a second or two.

**The app now asks you to sign in**, so it needs the auth server running — which
is what `./start.sh` is for. Create an account at `/signup` the first time. If you
would rather open the workspace with no account at all, create a file called
`.env.local` next to `package.json` containing:

```
VITE_REQUIRE_AUTH=false
```

Then `npm run dev` on its own is enough, and the app behaves exactly as it did
before login existed. Full detail: `AUTH-SETUP.md`.

## Step by step

1. Open VS Code, then **File → Open Folder** and pick `statskill-mac`.

2. Open the built-in terminal with **Control + `** (backtick). The prompt should
   already be inside `statskill-mac`. Confirm with:

   ```bash
   pwd
   ```

3. Check Node is installed and new enough (needs 20.19 or later):

   ```bash
   node -v
   ```

   No output, or "command not found"? Install Node first:

   ```bash
   brew install node
   ```

   No Homebrew either? Download the macOS LTS installer from
   <https://nodejs.org/en/download> and run it, then reopen the terminal.

4. Install the dependencies. Run this once:

   ```bash
   npm install
   ```

5. Start everything:

   ```bash
   ./start.sh
   ```

   You'll see the Node version, then the auth server coming up, then:

   ```
   VITE v7.3.6  ready in 812 ms
   ➜  Local:   http://localhost:5173/
   ```

   The browser opens by itself. If it doesn't, Command-click the link. You land on
   `/login`; use **Create an account** the first time.

   `npm run dev` still works if you only want the front end, but with the login
   gate on you will be asked to sign in and the page will tell you the auth server
   is not answering.

6. Stop everything with **Control + C** in the terminal.

## Pages

`/login` and `/signup` are full-page and outside the sidebar. Everything else sits
behind the login: `/` and `/dashboard` are the same landing view, then
`/assessment`, `/learning`, `/materials`, `/quiz`, `/intelligence`, `/roadmap`,
`/profile`, `/integrations`, `/presentation`, and `/courses/:id` from the course
cards.

## Other commands

Copy only the command itself — the terminal will not accept the description as
part of the line.

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript check, no build |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the built `dist/` locally |
| `npm run auth` | the auth server on its own, port 4000 |
| `npm test` | all four suites below, in order |
| `npm run engine:test` | 104 checks on the question engine and the scorer |
| `npm run auth:test` | 150 assertions against the server, over HTTP |
| `npm run client:test` | 34 checks that the browser code and the server agree |
| `npm run ui:test` | renders every route and checks the login gate |

## If something goes wrong

**Port 5173 already in use** — Vite moves to the next free port on its own and
prints the new URL. To force a specific port:

```bash
PORT=3000 npm run dev
```

**`npm install` fails partway** — clear it and retry:

```bash
rm -rf node_modules package-lock.json
npm install
```

**It keeps sending me to `/login`** — that is the login gate doing its job. Create
an account at `/signup`, or switch the gate off with `VITE_REQUIRE_AUTH=false` in
`.env.local` as described at the top.

**"The auth server is not answering."** — you started `npm run dev` without the
auth server. Use `./start.sh`, or run `npm run auth` in a second terminal. That
screen also has a button to open the demo anyway.

**Blank white page** — check the browser console (Command + Option + J). Open
the page through the `http://localhost:5173` URL, never by double-clicking
`index.html`; the app is an ES-module build and will not load over `file://`.

**Anything else** — copy the full red error text from the terminal and send it
over.

## Why this folder exists

The Replit export could not run on macOS. Its `pnpm-workspace.yaml` contained an
`overrides` block that deliberately excluded every non-Linux native binary,
including `lightningcss-darwin-arm64` and `@tailwindcss/oxide-darwin-arm64`.
Tailwind CSS v4 needs those two to compile CSS, so the build died on Apple
Silicon. On top of that, `vite.config.ts` threw an error unless Replit's `PORT`
and `BASE_PATH` environment variables were set, and the root `tsconfig.json`
pointed at `lib/db` and `lib/api-zod`, which are not in the export.

This folder is the same app with the Replit-specific layer removed: plain `npm`
instead of a pnpm workspace, exact pinned versions instead of `catalog:`
references, no `@replit/*` Vite plugins, and no platform exclusions. Everything
under `src/`, plus `index.html` and `public/`, is copied byte for byte from your
export, so the interface is unchanged.

## About the backend

Three kinds of screen, and they need the server to different degrees.

**The Materials Lab needs nothing.** It extracts text from your PDF and writes the
questions in the browser tab, through `pdfjs-dist` and `src/lib/materials.ts`. The
file is never uploaded. That quiz is graded in the tab too, because the tab is the
only thing that has seen its questions, and the finished attempt is then posted to
be stored.

**The Assessment needs the server, and cannot work without it.** The 15 scenarios
and their answer key live in `server/assessment.mjs` and nowhere else — `src/` does
not contain a single one of them, which `npm run ui:test` checks by searching every
file under `src/`. The paper is dealt without the key, your sitting is marked on the
server against it, and the score you see is the score that was stored. With the
server not running, that page says so instead of inventing a result.

**Your history needs the server**, because it is stored per account: attempts,
per-topic bands, saved courses and preferences, in JSON files under `server/data/`.

So `server/` is no longer only an auth server. It is twelve endpoints — signup,
login, logout, "who am I", deal a paper, submit a sitting, and the progress routes —
with no npm dependencies, only what ships with Node. `AUTH-SETUP.md` documents the
accounts half, including what its security does and does not cover.

Two screens are still sample content and say so on the page: Intelligence and
Integrations. The Dashboard, Learning, Roadmap and the preference switches on
Profile are still sample content as well — they are the next thing being converted,
and until then nothing on them is your data. What *is* measured today: the Materials
Lab and its quiz report, the Assessment and its report, your stored history, and the
account name and email in the sidebar and on Profile.

The `backend/` folder from your original export is still not wired to any screen,
and nothing needs it.
