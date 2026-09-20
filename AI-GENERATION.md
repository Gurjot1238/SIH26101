# Real AI question generation

What this document covers: what changed, how the pipeline actually works, the one
setting you have to choose, how to start it, how to check it yourself, what the
tests prove, and — at the end, in detail — what it still cannot do.

There are two ways to supply the model, and the project now ships set to the free
one: a model running on your own Mac through Ollama, no key and no account. Google's
API is still there behind one line of config. Everything else in this document —
grounding, the quality rules, the honesty floor — is shared by both and does not care
which you picked.

Nothing in the UI was redesigned. No CSS, no components, no layout, no routing, no
scoring, no progress tracking, no authentication. The look is provably unchanged: all
675 `className` attributes in `src/pages/demo-pages.tsx` are byte-identical to the
previous commit and in the same order, and `src/index.css`, `src/components/`,
`src/App.tsx`, `index.html` and `public/` are untouched.

The front-end code did change in two honest ways, both on the Materials Lab page and
neither of them visual. Copy was corrected where it had become false. And the logic
that drives the existing progress UI was rewired: question generation is now a network
call to the server instead of instant local work, so the existing `checking` stage was
given its own point on the progress bar rather than jumping straight to done, alongside
a seconds-elapsed readout for the wait that a real API round trip introduces and an
error branch for when the server says the feature is not configured. No element was
restyled, moved, added or removed — the same components render, driven by different
data.

---

## 1. The setting you have to fill in

One line, in `server/.env`, and which line depends on where you want the model to
run. `server/.env` is gitignored; `server/.env.example` carries the placeholders
and the documentation, and must never carry a value.

**A model on this Mac — no key, no account, no cost.** This is how the project
ships now:

```
AI_PROVIDER=local
```

Nothing else is required. `AI_LOCAL_URL` defaults to `http://127.0.0.1:11434/v1`
and `AI_MODEL` defaults to `gpt-oss:20b`, so the only prerequisite is Ollama
holding that model:

```
ollama pull gpt-oss:20b
ollama run gpt-oss:20b
```

**Google's API instead — faster, needs a key:**

```
AI_PROVIDER=gemini
GEMINI_API_KEY=
```

Get a key from https://aistudio.google.com/apikey and paste it after the `=`.
`AI_MODEL` then defaults to `gemini-1.5-flash`.

If neither is set up the feature does not degrade into something that looks like
AI. The page says, exactly:

> AI question generation is not configured. Add the server AI provider key and try again.

And when the provider is configured but the local model is not answering, the page
says *that* instead, naming the address it tried. The two are deliberately not the
same message: telling you to add a key, for a provider that has none, would send
you looking in the wrong place.

## 2. Starting it

```
cd ~/Documents/SIH26101/statskill-mac
./start.sh
```

That starts the auth server and Vite together and stops both on Control-C. Two
terminals works equally well if you prefer to watch the server log:

```
cd ~/Documents/SIH26101/statskill-mac
npm run auth
```

```
cd ~/Documents/SIH26101/statskill-mac
npm run dev
```

The AI lives on the auth server, so `npm run dev` alone gives you a Materials Lab
that cannot generate anything.

## 3. The manual test

1. Start the model if you are on `AI_PROVIDER=local`: `ollama run gpt-oss:20b` in
   its own terminal, left running.
2. `./start.sh`, then open http://localhost:5173/signup and create an account.
   Check the `AI` line in the server banner first — it names the provider, the
   model, and for `local` the address it will call.
3. Go to **Materials Lab** in the sidebar.
4. Upload a text-bearing PDF — a real one, ten pages or so, and under about 60,000
   characters of extracted text (roughly twenty pages; longer is refused at the door
   with a "document is too long" message rather than silently truncated). A scanned
   image PDF has no selectable text and will be refused before the AI is ever reached,
   which is the correct behaviour, not a bug.
5. Watch the progress states: extracting text, then generating. On Gemini this takes
   roughly five to twenty seconds depending on document length, because it is a real
   network round trip, possibly several. On a local 20B model the **first** document
   is much slower — tens of seconds of that is Ollama reading the model into memory,
   before it has answered anything — and every document after it is quick.
6. When it lands you get a count — **not** a hardcoded twelve. Twelve is the target;
   the number you see is how many survived validation.
7. Open the generated quiz. Answer a question, then reveal it. The **source**
   underneath each question is a sentence (or two) lifted from your PDF. Search your
   PDF for a distinctive phrase from it — the words are the document's own, though the
   spacing is normalised, so a phrase search matches where a whole-line search might
   not if your PDF wrapped that sentence across lines.
8. Now prove the AI is really being called. On `local`, quit Ollama and upload
   again: you get "could not reach the local AI model at http://127.0.0.1:11434"
   and zero questions. On `gemini`, blank out `GEMINI_API_KEY`, restart, and upload:
   you get the not-configured message and zero questions. Neither one falls back to
   the old local generator.
9. To see it fail the other honest way, set `AI_MODEL` to a model you have not
   pulled. You get "the local AI model was not found" with the `ollama pull` command
   to fix it — and on `gemini`, a wrong key gives a provider error with no key
   material anywhere in the response.

## 4. How the pipeline works

The browser extracts text; the browser never sees the key; the server never sees
your file.

**In the tab.** `src/lib/materials.ts` opens the PDF with `pdfjs-dist` and pulls out
the selectable text, exactly as before. The **file** is never uploaded. What is
posted is the extracted **text**.

**Over the wire.** `POST /api/ai/generate-mcqs`, carrying
`{ text, topics, concepts, questionCount, difficulty }`, authenticated with the existing session
cookie — the same one signup and login already issue. There is no second auth
system. Unauthenticated requests get a 401 that does not name the provider.

**On the server**, in layers that do not know about each other:

```
server/index.mjs      the route: auth, body limits, rate limit, HTTP status
server/ai/provider.mjs  chunking, the generation loop, repair, selection
server/ai/gemini.mjs    the only file that knows Gemini exists
server/ai/local.mjs     the only file that knows Ollama exists
server/ai/validation.mjs  parsing, grounding, and every quality rule
server/ai/prompt.mjs      the two prompts
server/ai/mock.mjs        canned replies, for the test suite only
```

Swapping provider is adding a file and a case in `selectProvider` (plus its import). No
provider-specific code sits in the route. Everything below the provider line —
chunking, grounding, the quality rules, the ten-question floor — is shared, so the
local model is held to exactly the same standard as Gemini and passes or fails the
same checks. Two places where the local file has to differ, and why:

- **Configured is not the same as reachable.** A local model has no key, so
  `isConfigured` can only check that the address parses. Ollama being switched off
  is therefore a `network_error` (HTTP 502) and never `not_configured` (503).
- **Timeout budget.** 180 seconds against Gemini's 30, because the first request
  after a restart pays for loading twenty billion parameters off disk. It also
  retries once without `response_format` if the server rejects that parameter,
  which older llama.cpp builds do, so JSON mode is not a setting anyone has to find.

**Chunking.** A long document is split on sentence boundaries into roughly
6,000-character chunks, at most six of them, and each chunk is asked for its share of
the target. Splits land only at sentence ends, because a question has to cite a
sentence the model can see whole; the one exception is the sixth chunk, which absorbs
the entire remaining tail rather than dropping it, so it can be much larger than 6,000
characters. Total provider calls across generation and repair are capped at eight, so
no document can cost an unbounded number of calls.

**The prompt** tells the model it is generating assessment material for India's
official statistical system, that it may use only the supplied material, and that it
must not invent facts, statistics, organisations, definitions, dates or
methodologies. It demands strict JSON — `{questions:[{question, options, correctIndex,
topic, kind, explanation, source}]}`. The parser will strip ```` ```json ```` fences
and pull the object out of surrounding prose if the model wraps it, but it never tries
to interpret free-form text as questions: anything it cannot parse into that exact
shape is rejected.

**Validation** is where most of the work is, and it is worth being precise about the
central idea, because it is not the obvious one.

The model returns a `source` — the sentence it says it was quoting. That string is
**never stored**. It is used only to locate *which* passage of your document was
being quoted: the quote's word-pairs are matched against windows of one or two
consecutive sentences in the real document (an inverted index prunes the candidates to
windows that actually share a word-pair, which changes nothing about the result), and
the best-scoring window at or above 0.8 wins. The real passage then **replaces** the
model's version.

That replacement is the whole defence, and the reason is measurable. A check that
merely asks "does this quote appear in the document" cannot work: changing a single
word inside an otherwise verbatim sentence of ordinary length still scores in the high
0.8s — 0.833 and 0.867 on the fixture's own sentences — because one substitution costs
only two word-pairs. A reversed claim, a swapped figure, a "twelve months" quietly
becoming "three months": a one-word change to a sentence of normal length clears any
threshold a genuine quote could also clear. So the question is not "is this quote true"
but "which sentence was it looking at", and once that is known, the model's copy is
thrown away. Every check after that point — and the text the learner reads — runs
against words provably lifted from the uploaded file.

Windows are capped at two consecutive sentences deliberately. Scored against the set
of every word-pair in a 60,000-character document, a "quote" welded together from
page 1 and page 40 scores 1.0; against a two-sentence window it cannot.

On top of the substituted passage:

- The correct answer must actually be in it. Short answers (three words or fewer)
  must appear as an exact run of words; longer ones must reach 50% containment, but
  only for `numeric`, `cloze` and `identify` questions.
- Every figure in the correct answer must appear in the passage. Every figure in the
  explanation and in the question stem must appear somewhere in the document.
- Every **name** in the explanation and the stem must appear somewhere in the
  document. A figure check does nothing about an invented institution, and that is the
  easier fabrication to believe: "The World Bank mandated this after the Geneva Accord
  on statistical harmonisation" contains no digits at all. Grounding explanation prose
  wholesale is impossible — a real paraphrase scores about 0.11 against its own source —
  but a proper noun is the one part of a paraphrase that cannot legitimately be new.
  Mid-sentence capitalisation is the signal, since in English prose it means a proper
  noun almost without exception; a word capitalised only because it opens a sentence is
  skipped, and two capitals in one token (`MoSPI`, `CPI`) counts as a name wherever it
  sits. Roman numerals and single letters are exempt, because "Statement II" is question
  furniture rather than a claim about the world.
- `kind` must be one of the existing `QuestionKind` values or the question is
  refused. An absent kind defaults to `statement`. The label never turns off the
  figure checks, the name check or the verbatim short-answer check — those run under
  every kind — but it does select two things: whether the 50%-containment rule above
  applies, and (for `cloze` only) whether the "stem gives away its own answer" check is
  skipped, since a fill-in-the-blank stem legitimately contains the answer. That the
  label still gates the containment rule is exactly the residual hole documented in
  section 8.
- Four distinct non-empty options, an in-range `correctIndex`, and a topic the document
  supports. `topics` is optional on the wire, so there are two rules rather than one:
  when the browser sends its extracted topic list the question's topic must be on it,
  and when it sends nothing every substantial word of the topic must still be a word the
  document uses. The second rule exists because the first one used to switch itself off
  on an empty list, and the topic is not cosmetic — the per-topic bands and the study
  plan are built from it.
- The question stem must not contain its own answer (except for `cloze`).
- Two duplicate defences run across the accepted set: a near-duplicate check on
  question *wording* (rejecting a new question 75% or more similar to one already
  kept), and an exact check on the pair of source passage and correct answer (so two
  differently-worded questions resting on the same fact collapse to one).

**Repair.** When a chunk falls short, the exact rejection reasons are handed back to
the model once and it is re-asked. Once — not a loop.

**Shortfall is reported, not padded.** Below ten surviving questions the request
fails with the real count and an explanation, because eight good questions beat
twelve invented ones. The count shown on screen is the count that came back
validated; nothing is displayed before the server has actually returned it.

**Competency tagging** reuses the existing classifier in `src/lib/topics.ts`
unchanged. Where it is unsure the competency stays `null`. No new competency IDs
were invented.

## 5. Where the key is, and is not

With `AI_PROVIDER=local` there is no key at all: no account, no credential, and
nothing that could leak, because the request goes to a port on your own machine.
The local adapter sends no `Authorization` header — deliberately, since an empty
bearer token breaks some servers — and a test asserts that its outgoing request
carries no auth header and no key material even when a canary `GEMINI_API_KEY` is
sitting in the same environment.

With `AI_PROVIDER=gemini` the key exists in exactly one place: the server
process's environment, read from `server/.env`. It is not in `src/`, not in any
Vite variable, not in localStorage, not in the material session, not in the
generated questions, and not in any response the browser receives.

That is asserted rather than assumed. `npm run auth:test` boots a server with a
canary key genuinely present in its environment and sweeps thirteen requests across
the server's routes — the success path, 401, 400, 413, malformed JSON, a missing
origin header, a route that does not exist — checking both headers and bodies of every
one. Zero occurrences. A negative control immediately afterwards seeds the canary into
a file and confirms the same grep can in fact see it, so the green result is not an
artefact of a broken search.

The startup banner is covered by the same run: that second server prints its banner
naming the provider while holding the canary, and its log is searched for any key
material and for the canary specifically — none is found. So is a third server, run
with the local provider pointed at a dead port, whose banner prints an address. The
banner's model field names the provider's real default there (`gemini-1.5-flash`, or
`gpt-oss:20b` for local) rather than the word "default", because the line exists so
you can confirm the model you pulled is the model about to be asked for, and "default
model" cannot answer that. The redaction branch for a key pasted onto the `AI_MODEL`
line is asserted separately, at the unit level, rather than by this server. On a real
machine the identical banner is what `start.sh` writes to `server/auth-server.log`, so
the same guarantee carries over, though the test exercises the server's own throwaway
log rather than that file by name.

`AI_PROVIDER`, `AI_MODEL` and `AI_LOCAL_URL` all sit near `GEMINI_API_KEY` in
`.env.example`, so the realistic accident is a key pasted onto the wrong line — and
all of those values get printed. None is echoed raw: an unrecognised provider reports
itself as `unrecognised`, a model name that does not look like a model name reports as
`custom model (set, not shown)`, and the local address is rebuilt from `new URL()` as
protocol plus host only, so a URL carrying `user:password@` is reduced before it can
reach the terminal or the log. The model allow-list grew to cover local families
(`gpt-oss`, `llama`, `qwen`, `mistral`, `gemma`, `phi`, `deepseek` and others) when the
local provider arrived, because a banner that redacts the very model you just
configured is worse than no banner — but it is still an allow-list, and every key
prefix in circulation (`AIzaSy`, `sk-`, `sk-ant-`, `sk-proj-`, `hf_`, `gsk_`) still
fails to match it.

One latent bug surfaced while wiring this up, and it belongs in this section. The
smoke test's AI assertions used to inherit `AI_PROVIDER` from whatever was in the
developer's own `server/.env`, so switching that file to `local` turned two key-safety
assertions red. They were right to complain: the same inheritance meant that the day a
real Gemini key was pasted into `server/.env`, the key-containment sweep would have
run against a process holding a real key, and nobody would have noticed the test had
stopped being hermetic. Those servers now pin `AI_PROVIDER` and an empty
`GEMINI_API_KEY` explicitly.

Request bodies are capped at 256 KB and refused at the door — a body whose declared
`Content-Length` exceeds the cap is rejected before it is read, and a body that streams
past the cap with no declared length is aborted mid-stream — so an oversized upload
cannot be read into memory. The 300 KB body the smoke test posts trips the first of
those and returns 413. Separately, document text is capped at 60,000 characters, but
that limit is checked after the body is parsed, so it is a content rule rather than a
memory guard.

## 6. What was changed

New:

```
server/ai/provider.mjs        295 lines   chunk, generate, repair, select
server/ai/validation.mjs      773 lines   parsing, grounding, every quality rule
server/ai/gemini.mjs          150 lines   the only Gemini-aware file
server/ai/local.mjs           250 lines   the only Ollama-aware file
server/ai/prompt.mjs          120 lines   generation and repair prompts
server/ai/mock.mjs             65 lines   canned replies for the tests
server/ai-fixtures/                       documents and model replies to test against
src/lib/ai-questions.ts                   the browser's typed client for the route
scripts/ai-test.mjs, ai-test.sh          131 checks, no API key and no model needed
AI-GENERATION.md                          this report
```

Modified: `server/index.mjs` (the route, its limits and its rate limit, and the
banner line that now names the provider's model and address), `server/http.mjs` (the
256 KB AI body cap), `server/ai/gemini.mjs` (one added export, so the banner can name
its default model), `server/.env.example` (placeholders and
documentation), `server/smoke-test.sh` (the AI section and the key-containment
sweep), `src/lib/materials.ts` (doc comments, and exposing one helper the client now
reuses) and `src/lib/material-session.ts` (doc comments only), `src/lib/progress.ts`,
`src/pages/demo-pages.tsx` (the wording and progress-logic changes described at the
top), `package.json` (the `ai:test` script, and `ai:test` added to the `test` chain),
`scripts/render-test.mjs`, `AUTH-SETUP.md` and `RUN-ON-MAC.md`. The server call itself
lives in the new `src/lib/ai-questions.ts`, which `demo-pages.tsx` invokes.

Wording corrected, because it had become false: "Local extraction", "No external AI
required" and "generated locally" are gone. The quiz intro in particular had said the
distractors were "generated locally from the source topic" — no longer true and, read
today, actively misleading about where questions come from — so it now says the
distractors are written to be plausible and the correct answer is the one checked
against a sentence in the material. Distractors are deliberately **not** grounded,
because a plausible wrong answer must not be findable in the document.

`generateQuestions` and `buildGroundedQuestions` were not deleted blindly — every
usage was traced first. Neither is reachable from any page now that the Materials Lab
calls the server. `generateQuestions` is kept because it still backs `analyzeMaterial`,
the deterministic fixture builder the engine and client suites use to produce a real
`MaterialQuestion[]` without a network or a key, so deleting it would break tests
unrelated to AI. `buildGroundedQuestions` has no remaining caller at all; it is left in
place only to preserve the module's original public signature, and could be removed.
Either way, nothing in the product presents their output to a user, so no canned
question is ever labelled as AI-generated.

## 7. Results

```
npm test         exit 0
  engine          116 passed, 0 failed
  auth (HTTP)     199 passed, 0 failed
  client          34 passed, 0 failed
  ai              131 passed, 0 failed
  ui render       61, 52, 48 passed, 0 failed
npm run typecheck            exit 0
node server/taxonomy-check.mjs   exit 0 — no drift
```

What those numbers do and do not cover for the local provider: the 131 AI checks
drive the whole pipeline through `server/ai/local.mjs` with `globalThis.fetch`
stubbed, so they prove the request shape, the URL, the header set, the JSON-mode
retry, every error mapping and the grounding rules — with no model installed and no
key. The five new smoke-test assertions prove the same over real HTTP against a
dead port. What none of it proves is a real answer from a real gpt-oss:20b, because
that needs the model actually loaded. That last step is the manual test in section 3.

No pre-existing failures remain. One (`/profile renders its own page inside the
shell`) was traced to a test asserting copy that a previous commit had changed, was
confirmed pre-existing against a clean checkout of `HEAD`, and was fixed in the test
rather than the page.

Zero new npm dependencies. The server still uses only what ships with Node.

**`npm run build` has not been run and you need to run it.** This sandbox is Linux on
aarch64 while `node_modules` holds the macOS `@rollup/rollup-darwin-arm64` binary, so
Vite cannot start here. That is a platform mismatch, not a defect in the project. On
your Mac:

```
cd ~/Documents/SIH26101/statskill-mac
npm run build
```

The test suite does not need an API key and never will. A live model would make the
interesting cases — malformed JSON, three options, a fabricated citation — slow,
costly and non-deterministic, and a suite that needs a key stops running.

## 8. What this does not do

Being specific here matters more than the rest of this document.

**A semantic reversal can still get through, in one narrow shape.** If the model
takes a real sentence, keeps every word, and builds a question whose correct answer
is a paraphrase longer than three words, containing no digits and naming no new
entity, under a `statement` or `scenario` label, then nothing in the validator
contradicts it. Figures are checked, names are checked, short answers are checked
verbatim, and the source is replaced with real text — but a meaning inverted using only
words that are already present is not caught programmatically.

Two heuristics that would catch it were tried and rejected on measurement. Requiring
containment for paraphrase answers fails: a legitimate answer like "Because it does
not capture consumers switching to cheaper alternatives" scores 0.11 against its real
source. Requiring at most one verbatim option kills legitimate questions such as the
one asking whether coverage is 1,181 villages or 1,114 urban markets. Both would have
produced enough false rejections to push real documents under the ten-question floor,
which would be a worse failure than the one they prevent.

The mitigation is structural rather than algorithmic: the learner is always shown the
document's own sentence, so a reversed claim is visibly contradicted by the passage
printed directly beneath it.

**The name check is a proper-noun check, not a fact check.** Every capitalised name
and acronym in the explanation and the stem has to occur in the document, which is what
stops an invented organisation or accord. It does not stop a false statement assembled
entirely out of ordinary lowercase words, and it does not verify that a real name is
being used in the way the document used it. It narrows the fabrication surface; it does
not close it.

**Number-words in answers are not grounded.** `digitsIn` reads `2012` and `25`, not
"twelve". Including number-words would reject ordinary phrasings like "one of the
four options". Number-word swaps are caught instead by the verbatim rule when the
answer is three words or fewer — "Three months" against a "twelve consecutive months"
sentence is refused — but not in longer answers.

**Distractors are deliberately not grounded at all.** A plausible wrong answer must not
be findable in the document, so none of the checks above run against the three options
the learner is meant to reject. A distractor can name anything.

**Question quality is not asserted.** Nothing here can prove the model writes *good*
questions, and that applies twice over to a 20B model running locally, which is a
smaller model than Gemini and can be expected to have more of its output rejected by
the grounding rules. The tests prove the pipeline handles what a model returns: that
fabrications are refused, that the JSON contract holds, that the repair loop
re-asks once, that shortfalls are honest. Whether the surviving questions are
pedagogically worth answering is a human judgement, and claiming the suite covers it
would be the same dishonesty the feature was built to avoid.

**The two size limits are not equivalent.** The 256 KB body cap and the 60,000-
character text cap measure different things, so heavily-escaped text can trip the
blunt 413 instead of the specific "document too long" message.

**Nothing asserts the rendered not-configured string end to end.** The server's
message is asserted exactly, and the page is asserted to render, but no test drives a
real browser to confirm the two meet.

**Scanned PDFs are out of scope.** No OCR. A PDF with no selectable text is refused
during extraction, before the AI is involved.

**No test has spoken to a real Ollama.** Every local-provider check runs against a
stubbed `fetch` or a deliberately dead port, which is what makes them runnable with
no model installed — and also means the one thing they cannot confirm is that a real
gpt-oss:20b returns JSON this parser accepts. Expect the first real run to reject
some questions; that is the grounding rules working, and the count on screen is the
count that survived. If it rejects so many that the ten-question floor is missed, the
page says so with the real number rather than padding.

**iGOT integration and personalised AI recommendations were not touched**, as
instructed.
