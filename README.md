# NEXORA AI Intelligence Platform

![Smart India Hackathon 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-0a7d2c)
![Problem Statement](https://img.shields.io/badge/Problem-SIH26101-1f6feb)
![Node](https://img.shields.io/badge/Node-%E2%89%A520.19-3c873a)
![Stack](https://img.shields.io/badge/React%2019-Vite%207-646cff)
![License](https://img.shields.io/badge/License-Proprietary-lightgrey)

A competency-based learning and assessment platform for statistical officers, built for
Ministry of Statistics and Programme Implementation (MoSPI) capacity building.
Smart India Hackathon 2026 — problem statement **SIH26101**.

> **SIH26101** calls for an AI-assisted platform to assess and strengthen the statistical
> competencies of MoSPI officers. NEXORA AI answers it with server-graded assessments,
> document-grounded practice, measured competency gaps, and a real course catalogue — all
> running on the user's own machine.

NEXORA AI runs entirely on your own machine. It deals and grades real competency
assessments on the server, turns a learner's own uploaded material into
document-grounded practice questions, tracks competency strengths and gaps from actual
attempts, and serves a catalogue of real open courses with lesson-level progress. There
is no mock data path in the product: a feature either does the real thing or reports
itself unavailable.

## Contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Quick start (macOS)](#quick-start-macos)
- [Configuration](#configuration)
- [npm scripts](#npm-scripts)
- [Testing and verification](#testing-and-verification)
- [Project structure](#project-structure)
- [Security](#security)
- [Documentation](#documentation)
- [Team](#team)
- [License](#license)

## Capabilities

- **Accounts and sessions.** Email/password signup and login with a login gate in front
  of the whole app. Passwords are hashed with scrypt; sessions are signed tokens with a
  configurable lifetime; signup and login are rate limited per account and per IP.
- **Server-side assessment.** The assessment paper is dealt and graded on the server —
  the question bank, the answer key, and the explanations never reach the browser before
  a paper is submitted. The result the learner sees is the server's marking.
- **Competency analytics.** After an assessment the Dashboard shows each competency
  against a target level, the shortfall, current strengths, and recommended priorities —
  all derived from the account's stored attempts, not from fixed figures.
- **Document-grounded question generation.** The Materials page turns an uploaded PDF or
  pasted text into multiple-choice questions that are checked against the source document
  before they are returned. If the model cannot ground enough questions you get a shorter
  set and a clear message, never invented filler. Runs against a local model (Ollama) or
  Google Gemini, selected by configuration.
- **Smart Document Intelligence.** Uploaded material is routed, chunked page-by-page,
  indexed and retrieved with BM25, and — for marksheets — analysed into a competency map.
- **OCR for scanned PDFs (optional).** Pages that carry no selectable text are rasterised
  in the browser and sent, as page images only, to an OCR provider: either a local
  PaddleOCR service or the hosted PaddleOCR API. The recognised text then flows through
  the same pipeline as normal text. The PDF file itself is never uploaded.
- **Courses.** A catalogue backed by a real open-educational-resource dataset with
  lesson-level completion tracking, an in-app reader that completes a lesson when it is
  read to the end, and a separate library of curated external courses. Measured gaps are
  bridged to real dataset courses through a recommendation service.
- **Saved sets and notifications.** Generated question sets can be saved per account, and
  the notification feed is derived from the account's own progress and activity.
- **Storage that scales with you.** Zero-configuration JSON files for local development,
  or PostgreSQL for durable, concurrent, multi-user production — chosen by one setting.

## Architecture

NEXORA AI is a single-page app talking to a small HTTP API, with two optional add-ons.

- **Frontend** — React 19 and TypeScript, bundled by Vite 7. Routing is `wouter`, server
  state is TanStack Query, styling is Tailwind CSS 4, charts are Recharts, and PDFs are
  read in the browser with `pdfjs-dist`. The app is gated behind sign-in and renders the
  real signed-in account.
- **API server** — `server/index.mjs`, written against the Node standard library with no
  web framework. It owns authentication, sessions, learner progress, competency
  analytics, recommendations, saved papers, notifications, the document-intelligence
  subtree, and the OCR proxy. The only npm package it touches at runtime is the
  PostgreSQL driver (`pg`), and only when the database backend is enabled; everything
  else is `node:*` built-ins.
- **OCR sidecar (optional)** — a small Python service under `server/ocr` that runs
  PaddleOCR inside a local virtualenv. `npm run dev` starts it alongside Vite
  automatically when OCR is enabled and configured for the local provider.
- **Data** — JSON files under `server/data` by default. Set `DATABASE_URL` and the same
  data (users, sessions, attempts, competency profiles, saved papers, the anonymised
  interaction log, and the whole document subtree) is stored in PostgreSQL instead.

```
Browser (React SPA, Vite)
        │  fetch  (cookies: signed session token)
        ▼
Node API server  ──►  JSON files  (default)
  server/index.mjs        or  PostgreSQL  (DATABASE_URL)
        │
        ├──►  AI provider   (local Ollama  |  Google Gemini)
        └──►  OCR provider   (local PaddleOCR sidecar  |  hosted PaddleOCR API)
```

## Requirements

- **macOS** with **Node.js 20.19 or newer** and npm.
- Optional, only for the features that use them:
  - **Python 3.10+** for the local OCR engine.
  - **PostgreSQL** for the database storage backend.
  - **[Ollama](https://ollama.com)** (free, local) or a **Google Gemini API key** for AI
    question generation.

## Quick start (macOS)

The one-command path installs dependencies on first run, creates `server/.env` from the
example, generates a session secret, starts the API server in the background, waits for
it to answer, and then starts the dev server:

```bash
./start.sh
```

Open the URL Vite prints (default <http://localhost:5173>) and create an account.
Run `./start.sh --help` for options, or `./start.sh --app-only` to skip the API server.

Prefer to run the pieces yourself:

```bash
npm install                      # first run only
cp server/.env.example server/.env
npm run auth                     # terminal 1 — API on http://127.0.0.1:4000
npm run dev                      # terminal 2 — app on http://localhost:5173
```

## Configuration

All server configuration lives in `server/.env`, copied from
[`server/.env.example`](server/.env.example). That file is gitignored and must never be
committed; the example documents every setting inline. The variables you are most likely
to touch:

| Variable | Purpose |
| --- | --- |
| `SESSION_SECRET` | Signs session tokens. Leave blank and the server invents a new one each start (signing everyone out on restart); `start.sh` fills it in for you. |
| `AUTH_PORT` / `AUTH_HOST` | Where the API server listens (default `127.0.0.1:4000`). |
| `ALLOWED_ORIGINS` | Browser origins allowed to call the API (default: the Vite dev origins). |
| `DATABASE_URL` | Blank → JSON storage. Set → PostgreSQL storage. |
| `AI_PROVIDER` | `local`, `gemini`, or `mock` (tests only). Picks the question-generation backend. |
| `GEMINI_API_KEY` | Server-side key used only when `AI_PROVIDER=gemini`. |
| `OCR_ENABLED` / `OCR_PROVIDER` | Master OCR switch and engine choice (`local`, `official_api`, `disabled`). |
| `PADDLEOCR_ACCESS_TOKEN` | Server-side token for the hosted OCR API. |

Secrets are read by the server process only. Anything prefixed `VITE_` is compiled into
the browser bundle and readable by any visitor, so keys and tokens must never carry that
prefix and never leave `server/.env`.

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the app (Vite), plus the local OCR sidecar when enabled. |
| `npm run auth` | Start the API server on its own. |
| `./start.sh` | Start the API server and the app together (recommended). |
| `npm run build` | Production build of the frontend. |
| `npm run typecheck` | Type-check the whole project with `tsc --noEmit`. |
| `npm test` | Run the full test suite (see below). |
| `npm run ui:test` | Compile `src/` and render every route server-side, gate on and off. |
| `npm run db:migrate` / `npm run db:verify` | Move existing JSON data into PostgreSQL and prove it. |
| `npm run auth:secret` | Print a fresh random session secret. |

## Testing and verification

The project ships with a broad automated suite. Run everything with:

```bash
npm test
```

It covers the scoring engine, competency analytics, the recommender and recommendation
service, an end-to-end API smoke test, the client libraries, AI grounding and exact-count
generation, document intelligence and the document pipeline, large-PDF handling, both OCR
providers, proxy IP parsing, the document-type guard, security hardening, notifications,
and a server-side render of the real route table. Type safety is checked separately:

```bash
npm run typecheck
```

The test suite defaults to the JSON storage backend so it needs no database; force it
explicitly with `DATABASE_URL='' npm test`. The production build (`npm run build`) and the
PostgreSQL path are exercised on macOS.

## Project structure

```
statskill-mac/
├── src/                 React + TypeScript single-page app
│   ├── pages/           screens (dashboard, assessment, materials, courses, profile, auth)
│   ├── components/      shell, providers, and shared UI primitives
│   ├── lib/             client-side engine, API clients, document helpers
│   ├── hooks/           React hooks
│   ├── App.tsx          route table
│   └── main.tsx         entry point
├── server/              Node API server (standard-library HTTP)
│   ├── index.mjs        routes, sessions, rate limiting, env loading
│   ├── auth.mjs         accounts, scrypt hashing, session tokens
│   ├── assessment.mjs   server-dealt paper and grading
│   ├── competency.mjs   competency analytics
│   ├── recommend/       recommendation service (rule / ML / hybrid)
│   ├── documents/       document intelligence + OCR proxy
│   ├── ocr/             Python PaddleOCR sidecar
│   ├── db/              PostgreSQL schema, pool, migrate, verify
│   └── smoke-test.sh    end-to-end API test
├── scripts/             build, dev, and test runners
├── docs/                setup and subsystem documentation
├── start.sh             one-command local start (macOS)
└── package.json
```

## Security

- The login gate is on by default; a production build never exposes a demo bypass.
- Passwords are hashed with scrypt using per-hash parameters; changing the cost does not
  invalidate existing accounts.
- Sessions are signed tokens with a configurable TTL; signup and login are rate limited
  per account and per IP, and a correct login clears the per-account failure counter.
- Secrets (the session secret, the Gemini key, the OCR token) are read only by the server
  process and never given a `VITE_` prefix, so they never enter the browser bundle, git,
  logs, or API responses. `server/.env` is gitignored.
- The hosted OCR path validates and pins the result URL to guard against SSRF, enforces
  HTTPS, and caps response sizes; the browser only ever talks to the NEXORA backend.
- Database TLS validates certificates by default.

## Documentation

Deeper guides live in [`docs/`](docs/):

- [Running on a Mac](docs/RUN-ON-MAC.md) — full local setup and troubleshooting.
- [Authentication and accounts](docs/AUTH-SETUP.md) — the auth server, the gate, sessions.
- [AI question generation](docs/AI-GENERATION.md) — providers, grounding, and the rules.
- [Competency analytics](docs/COMPETENCY-ANALYTICS.md) — how strengths and gaps are computed.
- [Recommendations](docs/RECOMMENDER.md) — the gap-to-course recommendation service.
- [OCR](docs/OCR.md) — the local and hosted PaddleOCR providers.
- [GitHub repo presentation](docs/GITHUB-ABOUT.md) — paste-ready About description, topics, and release steps.

## Team

Built by **Team NEXORA AI** for Smart India Hackathon 2026 (SIH26101).

<!-- Fill in your real team details before submission. -->

| Role | Name | Contact |
| --- | --- | --- |
| Team lead | _add name_ | [@Gurjot1238](https://github.com/Gurjot1238) |
| Member | _add name_ | _add_ |
| Member | _add name_ | _add_ |
| Member | _add name_ | _add_ |
| Mentor | _add name_ | _add_ |

**Institution:** _add your college / institution_

## License

All rights reserved. See [LICENSE](LICENSE). The Software is provided for Smart India
Hackathon 2026 evaluation; it is not licensed for redistribution or reuse without the
copyright holders' written permission.

---

Built for the Ministry of Statistics and Programme Implementation · Smart India Hackathon
2026 (SIH26101).



