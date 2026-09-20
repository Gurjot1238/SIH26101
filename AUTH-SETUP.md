# Login and signup — how to run and connect it

Two pages (`/login`, `/signup`), a small auth server that backs them, and a login
gate in front of the rest of the app. Everything below has been run and verified;
nothing here is aspirational.

One command starts both halves:

```bash
cd ~/Documents/SIH26101/statskill-mac
./start.sh
```

---

## 1. What was added, and what changed

**New — the auth server** (no `npm install` needed, it uses only what ships with Node):

```
server/index.mjs        the HTTP server and the routing table
server/auth.mjs         password hashing, session tokens, validation, rate limits
server/store.mjs        the JSON files on disk
server/papers.mjs       what a saved MCQ set may contain, and its stored shape
server/http.mjs         request parsing, CORS, security headers
server/.env.example     every setting, documented
server/smoke-test.sh    199 real HTTP assertions against throwaway servers
```

**New — the front end:**

```
src/pages/auth-pages.tsx             the Login and Signup pages
src/lib/auth.ts                      the browser client that talks to the server
src/lib/papers.ts                    saving, listing, opening and deleting MCQ sets
src/components/require-auth.tsx      the gate — now switched on, see section 5
src/components/session-provider.tsx  one place that knows who is signed in
scripts/render-test.sh, .mjs         renders every route and asserts on it
```

**Changed — five files under `src/`:**

| File | What changed |
| --- | --- |
| `App.tsx` | `/login` and `/signup` render full-page; everything else goes through the gate |
| `components/require-auth.tsx` | reads the session, and tells "signed out" apart from "server not running" |
| `components/shell.tsx` | sidebar name, email, initials and greeting come from your account; Sign out works |
| `pages/demo-pages.tsx` | the Profile card shows your account instead of the demo one |
| `pages/auth-pages.tsx` | hands the new account to the session before navigating |

`package.json` gained four scripts (`auth`, `auth:test`, `ui:test`, `auth:secret`)
and `start.sh` was rewritten to start both halves at once.

**Not changed — measured, not assumed.** 65 of the 70 pre-existing files under
`src/` are byte-identical, `src/index.css` among them. In the two existing UI files
that were touched, every `className` is unchanged and in the same order as your
original zip — all 63 in `shell.tsx`, all 430 in `demo-pages.tsx`. The edits there
only swap hardcoded names for your account's, keeping the old text as the fallback,
and give the dead "Sign out of demo" button something to do.

---

## 2. Run it

```bash
cd ~/Documents/SIH26101/statskill-mac
./start.sh
```

That is the whole thing. The script checks your Node version, installs
dependencies the first time, creates `server/.env` from the example if it is
missing, generates a `SESSION_SECRET` if that line is still blank, starts the auth
server in the background, waits until it actually answers, then starts Vite. When
you press Control-C it stops the auth server too.

The secret it generates never leaves your machine and is never printed. Server
output goes to `server/auth-server.log`. If the auth server fails to start, the
script prints the last lines of that log and carries on to Vite rather than dying
— you get the app with the "server not answering" panel, not a dead terminal.

Then open **http://localhost:5173/signup**, create an account, and you land on the
dashboard. **http://localhost:5173/login** signs you back in.

Two flags:

| Command | What it does |
| --- | --- |
| `./start.sh --app-only` | skip the auth server, run only Vite |
| `./start.sh --help` | what it does, in the terminal |

If a server is already listening on the auth port, the script says so, uses it,
and leaves it running when you quit — it only stops what it started.

### The two-terminal way, if you prefer it

**Terminal 1:**

```bash
cp server/.env.example server/.env
npm run auth:secret
```

The second line prints a random secret. Open `server/.env`, paste that value after
`SESSION_SECRET=`, save, then `npm run auth`. You should see a banner ending in
`Press Control-C to stop.`

**Terminal 2:** `npm run dev`

Skipping the `.env` step still works, but the server invents a new secret each
time it starts, which signs everyone out on restart. It tells you so on boot.

---

## 3. Prove it works

```bash
npm run auth:test
```

This starts its own servers on ports from 4399 up, against temporary folders,
fires 199 real HTTP requests, checks what landed on disk, then cleans up. Current
result:

```
199 passed, 0 failed
```

It checks, among other things, that a short password is rejected, that a wrong
password and an unknown account return the identical 401, that a forged cookie
fails, that a cross-site form POST is refused, that repeated wrong passwords get
rate limited, that `users.json` contains no plaintext password and is readable
only by you, that an unconfigured AI provider answers 503 with a message naming
what to configure, and that an unreachable **local** model answers 502 instead —
different problem, different advice, and no questions invented either way.

**The front end:**

```bash
npm run ui:test
```

This compiles `src/` into a temporary folder — nothing is written inside the
project — and renders your real route table with React's server renderer, twice:
once with the gate on, once with it off. Current result:

```
61 passed, 0 failed     gate on
52 passed, 0 failed     gate off (VITE_REQUIRE_AUTH=false)
48 passed, 0 failed     source checks
```

It proves that all thirteen of your existing routes still resolve to their own
page inside the sidebar shell, that a signed-out visitor gets nothing at all, that
a stopped auth server produces an explanation rather than a blank screen, that the
signed-in name really comes from the account, and that with the gate off every
original demo string is back exactly as it was.

What it cannot prove is anything that only happens on a click — the account menu is
closed until you open it, so the Sign out button never appears in rendered markup.
The source checks read the source instead, and the output labels them as such
rather than pretending they are the same thing.

---

## 4. How the two halves are connected

They already are — this section is so you know where to look when you change
something.

The page calls `src/lib/auth.ts`. That file has one setting:

```ts
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000')
```

So by default the browser talks to `http://127.0.0.1:4000`, which is where
`npm run auth` listens. Every request sends `credentials: 'include'`, which is
what makes the browser attach the session cookie to a different port.

On the server side, `server/.env` has the matching half:

```
AUTH_PORT=4000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`ALLOWED_ORIGINS` is a strict allowlist. If the page is served from an address
that is not in that list, the server answers `403` and the browser blocks the
response. That is deliberate — it is one of the three things stopping another
website from posting to your API on your behalf.

**To move the API to another port**, change both sides:

```bash
# server/.env
AUTH_PORT=4100

# .env.local in the project root (create it)
VITE_API_URL=http://127.0.0.1:4100
```

**To serve the app from a different address**, add that address to
`ALLOWED_ORIGINS` in `server/.env`, comma separated, no trailing slash.

### Every setting, and which side reads it

| Setting | Lives in | Does what |
| --- | --- | --- |
| `VITE_API_URL` | `.env.local` | where the browser looks for the auth server |
| `VITE_REQUIRE_AUTH` | `.env.local` | `false` turns the login gate off |
| `AUTH_PORT` | `server/.env` | where the auth server listens |
| `ALLOWED_ORIGINS` | `server/.env` | addresses allowed to call the API |
| `SESSION_SECRET` | `server/.env` | signs session tokens; blank means new sessions on every restart |
| `COOKIE_SECURE` | `server/.env` | `true` once you serve over https |
| `AI_PROVIDER` | `server/.env` | which AI writes the questions: `local` or `gemini` |
| `AI_LOCAL_URL` | `server/.env` | where the local model listens; blank means `http://127.0.0.1:11434/v1` |
| `AI_LOCAL_TIMEOUT_MS` | `server/.env` | how long to wait on the local model; blank means 180000 |
| `GEMINI_API_KEY` | `server/.env` | the Gemini key; only read when `AI_PROVIDER=gemini` |
| `AI_MODEL` | `server/.env` | which model to ask; blank uses the provider's default |
| `AI_GENERATION_LIMIT` | `server/.env` | generation requests allowed per IP per hour |

Anything starting `VITE_` is read at build time and is visible in the browser, so
never put a secret there. `server/.env` is gitignored and stays on your machine.

### Turning on AI question generation

The Materials page reads an uploaded PDF in the browser and then asks the server
to write questions from the extracted text. The server is the only party that
talks to the model, and the only party that would hold a key.

There are two providers. Pick one with `AI_PROVIDER` in `server/.env`.

**A model on this Mac — no key, no account, no cost.** This is what the project
is set to now. Install Ollama from <https://ollama.com/download>, pull the model
once, and leave it running:

```bash
ollama pull gpt-oss:20b
ollama run gpt-oss:20b
```

```bash
# server/.env
AI_PROVIDER=local
```

Nothing else is required: `AI_LOCAL_URL` defaults to `http://127.0.0.1:11434/v1`,
which is where Ollama listens, and `AI_MODEL` defaults to `gpt-oss:20b`. Set
either one only if your setup differs — LM Studio, for instance, serves on
`http://127.0.0.1:1234/v1`. The address deliberately says `127.0.0.1` rather than
`localhost`, because on macOS `localhost` can resolve to IPv6 first while Ollama
listens on IPv4 only, and the resulting refused connection looks identical to
Ollama being switched off.

The first document is slow — a 20B model has to be read into memory before it
answers, which is tens of seconds — so the local provider waits up to three
minutes (`AI_LOCAL_TIMEOUT_MS`) against Gemini's thirty seconds. Later documents
are much quicker. If 20B is heavy on your machine, pull something smaller and put
it in `AI_MODEL`, for example `llama3.1:8b`.

**Google's API — faster, needs a key.** Get one from
[Google AI Studio](https://aistudio.google.com/apikey), then:

```bash
# server/.env
AI_PROVIDER=gemini
GEMINI_API_KEY=paste-your-key-here
```

Restart the auth server either way. It prints which provider it chose, which
model it will ask for, and — for `local` — the address it will call, on the line
beginning `AI` in its startup banner. Check that line first whenever generation
misbehaves; most local failures are the server and Ollama disagreeing about the
port, and you cannot see that without printing both.

With no provider configured, the Materials page reports the feature as not
configured rather than producing questions anyway. That is deliberate. The
project still contains a local, non-AI question generator, but it is no longer
wired into the upload flow — falling back to it silently would put the words "AI
generated" above questions that no AI ever saw, and nobody looking at the screen
could tell. For the same reason, Ollama being unreachable is reported as
unreachable (and names the address it tried), never as "not configured": being
told to add a key you do not need, for a provider that has none, would send you
looking in the wrong place.

Two things to know before you demo it:

- With `AI_PROVIDER=local`, nothing leaves the Mac. With `AI_PROVIDER=gemini`,
  the uploaded **file** still never leaves the browser, but the **text extracted
  from it** is posted to your own server, which forwards it to Google — so do not
  upload anything confidential in that mode.
- Generation costs a provider call per document chunk. `AI_GENERATION_LIMIT`
  (default 30 per IP per hour) is the budget guard. It matters less locally,
  where a call costs only time, but it also stops one tab from queueing up more
  work than your Mac can chew through.

### The endpoints

| Method | Path | Body | Answers |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `200` and the password policy |
| `POST` | `/api/auth/signup` | `{ name, email, password }` | `201`, sets the cookie |
| `POST` | `/api/auth/login` | `{ email, password }` | `200`, sets the cookie |
| `POST` | `/api/auth/logout` | `{}` | `200`, clears the cookie |
| `GET` | `/api/auth/me` | — | `200` and the user, or `401` |
| `POST` | `/api/ai/generate-mcqs` | `{ text, topics, concepts, questionCount, difficulty }` | `200` and a paper, or `401` / `400` / `413` / `503` |
| `POST` | `/api/papers` | `{ title, difficulty, questions }` | `201` and the saved set, or `401` / `400` |
| `GET` | `/api/papers` | — | `200` and your saved sets, newest first |
| `GET` | `/api/papers?id=…` | — | `200` and one set with its questions, or `404` |
| `DELETE` | `/api/papers?id=…` | — | `200`, or `404` if it is not yours |
| `GET` | `/api/analytics/competencies` | `?scope=all` (default) or `latest` | `200` and the competency analysis, or `401` / `400` |
| `POST` | `/api/analytics/explain` | — (rebuilt server-side; `?scope=` only) | `200` and a prose summary, or `401` / `409` / `503` / `502` |

A saved set holds the questions, the options, the answer key and the explanations —
unlike an attempt, which deliberately stores only topic names and counts. That is
safe because a set is the learner's own material, saved by choice, and the routes
above read and write only the calling account's own papers: asking for another
account's id returns `404`, not the paper. Sixty sets are kept per account; past
that the oldest is dropped.

Failures always come back in the same shape, so the form can put a message under
the right input:

```json
{ "ok": false, "error": { "code": "invalid_input",
  "message": "Use at least 10 characters.",
  "fields": { "password": "Use at least 10 characters." } } }
```

---

## 5. The login gate — on by default, and how to turn it off

The app no longer opens straight to the dashboard. `src/App.tsx` wraps everything
except `/login` and `/signup` in `<RequireAuth>`:

```tsx
<Switch>
  <Route path="/login" component={Login} />
  <Route path="/signup" component={Signup} />
  <Route><RequireAuth><ShellRoutes /></RequireAuth></Route>
</Switch>
```

All thirteen routes inside `ShellRoutes` are untouched. Four things can happen:

| Session state | What you see |
| --- | --- |
| still checking | a loading block, and never any protected content |
| signed in | the app, exactly as before |
| signed out | redirected to `/login` |
| auth server not running | a panel naming the problem and printing `npm run auth` |

That last row is the reason the gate is not a one-line boolean. "You are signed
out" and "the auth server is down" look identical if you only track true/false,
and they need opposite responses — one sends you to the login page, the other
tells you to start a server. The panel offers Retry and, because nothing behind
the gate is server data, an explicit **Open the demo without signing in**.

**To open the workspace without an account**, create `.env.local` in the project
root:

```
VITE_REQUIRE_AUTH=false
```

Restart `npm run dev`. That restores the pre-gate behaviour exactly — demo name,
demo department, demo greeting — which is what `npm run ui:test` verifies in its
second pass. Only the exact string `false` switches it off; anything else, and
anything missing, means on.

**Be honest about what the gate is.** It keeps the workspace behind a login, but
every page behind it renders demonstration data that ships inside the JavaScript
bundle. Anyone who wants that data can read it out of the bundle. The real
enforcement — accounts, password hashing, session cookies, rate limits — is in
`server/`. When a page starts fetching per-user data from an API, delete the
"open the demo anyway" button in `require-auth.tsx` and let the server reject the
request instead. There is a comment in that file saying so.

## 6. Who the app thinks you are

`src/components/session-provider.tsx` asks `/api/auth/me` once when the app
mounts and every component reads the answer from context, so the gate, the sidebar
and the Profile page do not each fire their own request.

```tsx
const { user, signOut } = useSession();
```

`user` is `null` when nobody is signed in, so every display falls back to the
original demo text:

```tsx
{user?.name ?? 'Ananya Sharma'}
```

That pattern is why a signed-out or gate-off screen looks exactly as it always
did. It is used in three places: the sidebar footer card and the header greeting
in `shell.tsx`, and the Profile card in `demo-pages.tsx`. The helpers next to it —
`initials()`, `firstName()`, `greeting()` — carry the same fallbacks, so `AS` and
"Ananya" appear when there is no account.

The sidebar's **Sign out** button is now real: it calls the server, clears the
session and sends you to `/login`, disabling itself while the request is in
flight. With no account signed in it still reads "Sign out of demo", as before.

`Role: Statistical Officer` and `Location: Bengaluru` on the Profile page are
still demo content. Your account record has a `role` field, but it is `learner`
for everyone and nothing reads it yet — showing that instead would be worse, not
better.

---

## 7. What the security actually does — and what it doesn't

**It does:**

Passwords are hashed with **scrypt** (N=32768, r=8, 64-byte key, 16-byte random
salt per password), which is memory-hard and on OWASP's acceptable list. The cost
parameters live inside each hash string, so raising them later does not
invalidate anyone's password. No password is stored, logged, or returned by any
endpoint — the smoke test checks for exactly this on disk and in the log.

Sessions are 256 bits of randomness in an `HttpOnly; SameSite=Lax` cookie.
JavaScript cannot read it, so no script on the page can steal it. Only the
HMAC-SHA256 of the token is written to disk, so even a leaked `sessions.json`
cannot be used to mint a working cookie without your `SESSION_SECRET`.

CSRF is blocked three ways at once: the `SameSite=Lax` cookie, a mandatory
`application/json` content type (an HTML form on another site cannot produce
one), and an `Origin` allowlist on every state-changing request.

A wrong password and an unknown account return the byte-identical `401`, and the
server spends the same CPU on a decoy hash when the email doesn't exist, so
response timing cannot be used to discover which addresses are registered.

Everything is validated on the server: length caps on every field (an 8 KB body
limit, 200-character password cap), control characters stripped, email
normalised to lowercase, obvious passwords and passwords containing your own
name or email refused. Failed logins are rate limited per account and per IP.

Files are written atomically (temp file then `rename`) at mode `600`, in a
directory at `700`. Both are gitignored.

**It doesn't:**

The **login gate is not a security boundary** — see section 5. It keeps the
workspace behind an account, but the pages behind it render demonstration data
that ships in the bundle, so it protects the experience rather than the data.

There is **no email verification**, so nobody proves they own the address they
sign up with. Because of that, duplicate signup returns a plain "already exists",
which does tell an attacker that an address is registered. Real products fix both
of these together.

There is **no password reset**. The login page says so rather than showing a dead
link.

There are **no roles or permissions** yet — every account is created as
`learner`. The field exists in the record; nothing reads it.

Rate limiting is **in-memory**, so it resets when you restart the server and does
not work across multiple processes. It stops casual guessing, which is the real
threat here. Production would move it to Redis or the reverse proxy.

The store is **two JSON files**, rewritten in full on every change. Fine for a
demo and a few hundred accounts; not a database.

`COOKIE_SECURE=false` is correct for `http://localhost`. Set it to `true` the
moment you serve the site over https, or the browser will refuse the cookie.

## 8. If something goes wrong

**"The auth server is not answering."** filling the page — the server isn't
running. Quit and use `./start.sh`, which starts both, or run `npm run auth` in a
second terminal. The panel's Retry button re-checks without a reload.

**The app sends you to `/login` and you just want the demo** — put
`VITE_REQUIRE_AUTH=false` in `.env.local` and restart `npm run dev` (section 5).

**`./start.sh` says the auth server never came up** — read
`server/auth-server.log`; the reason is the last few lines. Most often the port is
taken.

**`Port 4000 is already in use`** — something else has it. `AUTH_PORT=4100 npm run auth`,
and set `VITE_API_URL=http://127.0.0.1:4100` in `.env.local`.

**Signup works but you're signed out after restarting the server** — `SESSION_SECRET`
is still blank in `server/.env`. `./start.sh` fills it in for you; the manual fix is
`npm run auth:secret` and paste.

**You signed in but land back on `/login`** — that would be the session not being
adopted after login. Run `npm run ui:test`; the source check named "both auth pages
hand the account to the session" covers exactly this.

**`403` on every request** — the address in your browser's URL bar is not in
`ALLOWED_ORIGINS`. `localhost` and `127.0.0.1` are different origins to a
browser, so both are in the default list; anything else you must add.

**Too many attempts** — you hit a rate limit. Wait it out, or restart the server,
which clears the in-memory counters.

**Start over with no accounts** — `rm -rf server/data`. That deletes every account
and cannot be undone.
