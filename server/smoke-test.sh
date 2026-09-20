#!/usr/bin/env bash
# End-to-end check of the auth and progress server. Starts its own server on a
# spare port, against a throwaway data directory, then shuts it down.
#
#   ./server/smoke-test.sh
#
# Every line printed as "ok" is a real HTTP request that got the expected status,
# or a real assertion about what ended up on disk. Nothing here is mocked.

set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${SMOKE_PORT:-4399}"
BASE="http://127.0.0.1:${PORT}"
DATA_DIR="$(mktemp -d)"
JAR="${DATA_DIR}/cookies.txt"
JAR2="${DATA_DIR}/cookies2.txt"
LOG="${DATA_DIR}/server.log"
JSON='Content-Type: application/json'
ORIGIN='Origin: http://localhost:5173'

PASS=0
FAIL=0

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  wait "${SERVER_PID:-}" 2>/dev/null
  # The AI section starts a second server on the next port up. If the script dies
  # between starting it and stopping it, this is what stops it being orphaned.
  [ -n "${MOCK_PID:-}" ] && kill "$MOCK_PID" 2>/dev/null
  wait "${MOCK_PID:-}" 2>/dev/null
  rm -rf "$DATA_DIR"
}
trap cleanup EXIT

# Expects: description, expected status, then curl arguments.
check() {
  local label="$1" want="$2"; shift 2
  local got
  got="$(curl -sS -o "${DATA_DIR}/body" -w '%{http_code}' "$@")"
  if [ "$got" = "$want" ]; then
    PASS=$((PASS + 1))
    printf '  ok    %-46s %s\n' "$label" "$got"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  %-46s got %s, wanted %s\n' "$label" "$got" "$want"
    sed 's/^/          /' "${DATA_DIR}/body"
  fi
}

# Expects: description, then a string that must appear / must not appear.
expect_in_body() {
  if grep -q "$2" "${DATA_DIR}/body"; then
    PASS=$((PASS + 1)); printf '  ok    %s\n' "$1"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s — %s not found in response\n' "$1" "$2"
  fi
}

# The mirror image. A missing body file is a FAILURE for the same reason as below:
# "the response does not leak X" must not be green because there was no response.
expect_not_in_body() {
  if [ ! -f "${DATA_DIR}/body" ]; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s — no response body was captured\n' "$1"
  elif grep -q "$2" "${DATA_DIR}/body"; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s — found "%s" in the response\n' "$1" "$2"
  else
    PASS=$((PASS + 1)); printf '  ok    %s\n' "$1"
  fi
}

# Expects: description, file, string that must NOT appear.
# A missing file is a FAILURE, not a pass — otherwise "the password isn't in
# users.json" would look green simply because no account was ever created.
expect_not_in_file() {
  if [ ! -f "$2" ]; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s — %s does not exist\n' "$1" "$2"
  elif grep -q "$3" "$2"; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s — found "%s" in %s\n' "$1" "$3" "$2"
  else
    PASS=$((PASS + 1)); printf '  ok    %s\n' "$1"
  fi
}

printf '\n  Auth and progress server end-to-end check\n  ========================================\n\n'

# AI_PROVIDER and GEMINI_API_KEY are pinned rather than inherited, and that matters more
# than it looks. server/index.mjs reads server/.env for anything not already in the
# environment, so without these two lines this process picks up whatever the developer
# happens to have configured — which means the "not configured" section below was asserting
# a property of one person's laptop. It broke the day server/.env was switched to a local
# model, and it would equally have broken, more quietly, the day a real Gemini key was
# pasted in: the 503 assertions would fail, and every 'AIza' assertion would start running
# against a process holding a real key. An empty value still counts as set, so .env cannot
# override it back.
AUTH_PORT="$PORT" \
AUTH_DATA_DIR="$DATA_DIR" \
SESSION_SECRET="smoke_test_secret_not_used_anywhere_real_0123456789abc" \
AI_PROVIDER=gemini \
GEMINI_API_KEY= \
node server/index.mjs > "$LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  curl -sS -o /dev/null "${BASE}/api/health" 2>/dev/null && break
  sleep 0.25
done

if ! curl -sS -o /dev/null "${BASE}/api/health" 2>/dev/null; then
  printf '  Server did not start. Log:\n\n'
  sed 's/^/    /' "$LOG"
  exit 1
fi

printf '  --- basics ---\n'
check 'GET /api/health' 200 "${BASE}/api/health"
expect_in_body 'health reports scrypt hashing' 'scrypt'
check 'unknown route is 404' 404 "${BASE}/api/nope"
check 'wrong method is 405' 405 -X POST "${BASE}/api/health" -H "$JSON" -H "$ORIGIN" -d '{}'

printf '\n  --- signup validation ---\n'
check 'password under 10 chars rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Test User","email":"a@example.gov","password":"short1"}'
check 'common password rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Test User","email":"a@example.gov","password":"password123"}'
check 'password containing the email rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Test User","email":"ananya@example.gov","password":"ananya-1234567"}'
check 'malformed email rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Test User","email":"not-an-email","password":"a good long passphrase"}'
check 'one-character name rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"A","email":"b@example.gov","password":"a good long passphrase"}'
check 'non-string password rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Test User","email":"c@example.gov","password":12345678901}'
check 'missing fields rejected' 400 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" -d '{}'

printf '\n  --- signup and login ---\n'
check 'signup succeeds' 201 -c "$JAR" -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"  Ananya Sharma  ","email":"  Ananya@Example.GOV  ","password":"correct horse battery staple"}'
expect_in_body 'email normalised to lowercase' 'ananya@example.gov'
expect_in_body 'response never contains the hash' 'usr_'
check 'duplicate email is 409' 409 -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Someone Else","email":"ananya@example.gov","password":"a different long passphrase"}'
check 'session cookie works on /me' 200 -b "$JAR" "${BASE}/api/auth/me"
check 'wrong password is 401' 401 -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" \
  -d '{"email":"ananya@example.gov","password":"wrong password entirely"}'
check 'unknown account is also 401' 401 -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" \
  -d '{"email":"nobody@example.gov","password":"wrong password entirely"}'
check 'login with mixed-case email succeeds' 200 -c "$JAR" -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" \
  -d '{"email":"ANANYA@example.gov","password":"correct horse battery staple"}'

printf '\n  --- sessions ---\n'
check '/me without a cookie is 401' 401 "${BASE}/api/auth/me"
check '/me with a forged cookie is 401' 401 "${BASE}/api/auth/me" -H 'Cookie: sk_session=made-up-token-value'
check 'logout succeeds' 200 -b "$JAR" -c "$JAR" -X POST "${BASE}/api/auth/logout" -H "$JSON" -H "$ORIGIN"
check '/me after logout is 401' 401 -b "$JAR" "${BASE}/api/auth/me"
check 'logout with no session still succeeds' 200 -X POST "${BASE}/api/auth/logout" -H "$JSON" -H "$ORIGIN"

printf '\n  --- request hardening ---\n'
check 'form-encoded body rejected (CSRF control)' 415 -X POST "${BASE}/api/auth/login" -H "$ORIGIN" \
  -H 'Content-Type: application/x-www-form-urlencoded' -d 'email=a@b.gov&password=xyz'
check 'unparseable JSON rejected' 400 -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" -d '{not json'
check 'JSON array body rejected' 400 -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" -d '[1,2,3]'
check 'oversized body rejected' 413 -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" \
  -d "{\"email\":\"a@b.gov\",\"password\":\"$(head -c 20000 /dev/zero | tr '\0' 'x')\"}"
check 'untrusted origin rejected' 403 -X POST "${BASE}/api/auth/login" -H "$JSON" \
  -H 'Origin: https://evil.example.com' -d '{"email":"a@b.gov","password":"whatever long"}'
check 'preflight from allowed origin' 204 -X OPTIONS "${BASE}/api/auth/login" -H "$ORIGIN" \
  -H 'Access-Control-Request-Method: POST'
check 'preflight from untrusted origin' 403 -X OPTIONS "${BASE}/api/auth/login" \
  -H 'Origin: https://evil.example.com' -H 'Access-Control-Request-Method: POST'

printf '\n  --- progress: nothing is readable without a session ---\n'
ATTEMPTS="${BASE}/api/progress/attempts"
ONE_ATTEMPT='{"source":"material","label":"Anything","total":4,"correct":2}'
check 'GET /api/progress is 401' 401 "${BASE}/api/progress"
check 'GET history is 401' 401 "$ATTEMPTS"
check 'saving an attempt is 401' 401 -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" -d "$ONE_ATTEMPT"
check 'clearing history is 401' 401 -X DELETE "$ATTEMPTS" -H "$ORIGIN"
check 'saving preferences is 401' 401 -X POST "${BASE}/api/progress/preferences" -H "$JSON" -H "$ORIGIN" -d '{"language":"Hindi"}'
check 'saving course progress is 401' 401 -X POST "${BASE}/api/progress/courses" -H "$JSON" -H "$ORIGIN" -d '{"courseId":"time-series"}'
check 'PUT on attempts is 405, not 401' 405 -X PUT "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" -d '{}'

printf '\n  --- progress: saving a result ---\n'
check 'sign back in for the progress tests' 200 -c "$JAR" -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" \
  -d '{"email":"ananya@example.gov","password":"correct horse battery staple"}'
check 'empty progress is a real answer, not an error' 200 -b "$JAR" "${BASE}/api/progress"
expect_in_body 'no attempts yet reads as unrated' '"band":"unrated"'
expect_in_body 'preferences come back with defaults' '"language":"English"'

# Deliberately dishonest and deliberately overloaded. percent, band and the topic
# percentages are all wrong, competencyPercents names a competency the paper never
# tested, and text/questions/sentences carry document content the server must not
# keep. 1 of 4 plus 5 of 6 is 6 of 10, so the counts themselves are consistent.
LYING_ATTEMPT='{"source":"material","label":"Sampling manual, chapter 3","total":10,"correct":6,
  "percent":100,"band":"strong","durationSeconds":420,
  "topics":[{"topic":"Margin Of Error","competency":"inference","correct":1,"total":4,"percent":100,"band":"strong"},
            {"topic":"Data Validation","competency":"data-quality","correct":5,"total":6,"percent":0,"band":"needs-work"}],
  "competencyPercents":{"leadership":100},
  "text":"CONFIDENTIAL-DOCUMENT-BODY",
  "questions":[{"stem":"CONFIDENTIAL-QUESTION-STEM","answer":2}],
  "sentences":["CONFIDENTIAL-SENTENCE"]}'
check 'attempt saves' 201 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" -d "$LYING_ATTEMPT"
# Each pattern below carries its neighbouring fields on purpose. The response also
# contains the whole-account rollup, which legitimately holds its own "percent":60
# and "band":"average" — matching those bare would pass even if the saved attempt
# kept the number the client posted. Sabotaging the server proved exactly that.
expect_in_body 'percent recomputed from the counts, not trusted' '"total":10,"correct":6,"percent":60'
expect_in_body 'band recomputed to match' '"percent":60,"band":"average"'
expect_in_body 'topic percent recomputed (1 of 4)' '"topic":"Margin Of Error","competency":"inference","correct":1,"total":4,"percent":25'
expect_in_body 'competency rolled up from the topics' '"data-quality":83'
expect_not_in_body 'a competency the paper never tested is dropped' 'leadership'
expect_not_in_body 'document text is not echoed back' 'CONFIDENTIAL-DOCUMENT-BODY'
expect_not_in_body 'question text is not echoed back' 'CONFIDENTIAL-QUESTION-STEM'
check 'second attempt saves' 201 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"Retry: margin of error","total":4,"correct":4,"topics":[{"topic":"margin of error","competency":"inference","correct":4,"total":4}]}'
expect_in_body 'rollup now spans both attempts' '"progress":{"attempts":2'

printf '\n  --- progress: what an attempt may contain ---\n'
check 'unknown source rejected' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"exam","label":"x","total":4,"correct":2}'
check 'blank label rejected' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"   ","total":4,"correct":2}'
check 'more correct than asked rejected' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"x","total":4,"correct":9}'
check 'fractional question count rejected' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"x","total":4.5,"correct":2}'
check 'topics adding up past the paper rejected' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"x","total":4,"correct":2,"topics":[{"topic":"A","correct":1,"total":3},{"topic":"B","correct":1,"total":3}]}'
check 'invented competency rejected' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"x","total":4,"correct":2,"topics":[{"topic":"A","competency":"wizardry","correct":1,"total":2}]}'
check 'oversized attempt body rejected' 413 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d "{\"source\":\"material\",\"label\":\"$(head -c 20000 /dev/zero | tr '\0' 'x')\",\"total\":4,\"correct\":2}"
check 'form-encoded attempt rejected (CSRF control)' 415 -b "$JAR" -X POST "$ATTEMPTS" -H "$ORIGIN" \
  -H 'Content-Type: application/x-www-form-urlencoded' -d 'source=material&label=x&total=4&correct=2'
check 'attempt from an untrusted origin rejected' 403 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" \
  -H 'Origin: https://evil.example.com' -d "$ONE_ATTEMPT"

printf '\n  --- progress: history ---\n'
check 'history returns both attempts' 200 -b "$JAR" "$ATTEMPTS"
expect_in_body 'newest first' '"attempts":\[{"id":"att_[0-9a-f]*","at":"[^"]*","source":"material"'
check 'limit=1 returns one' 200 -b "$JAR" "${ATTEMPTS}?limit=1"
expect_in_body 'total still reports everything held' '"total":2'
check 'limit=9999 is clamped, not refused' 200 -b "$JAR" "${ATTEMPTS}?limit=9999"
expect_in_body 'clamped to the per-account cap' '"limit":200'
check 'limit=abc rejected' 400 -b "$JAR" "${ATTEMPTS}?limit=abc"
check 'limit=0 rejected' 400 -b "$JAR" "${ATTEMPTS}?limit=0"

printf '\n  --- progress: preferences and course progress ---\n'
check 'language and toggle save' 200 -b "$JAR" -X POST "${BASE}/api/progress/preferences" -H "$JSON" -H "$ORIGIN" \
  -d '{"language":"Hindi","weeklyNote":false}'
expect_in_body 'preference is applied' '"language":"Hindi"'
expect_in_body 'demoLabels stays on unless asked' '"demoLabels":true'
check 'unsupported language rejected' 400 -b "$JAR" -X POST "${BASE}/api/progress/preferences" -H "$JSON" -H "$ORIGIN" \
  -d '{"language":"Klingon"}'
check 'misspelled preference rejected, not ignored' 400 -b "$JAR" -X POST "${BASE}/api/progress/preferences" -H "$JSON" -H "$ORIGIN" \
  -d '{"langauge":"Hindi"}'
check 'non-boolean toggle rejected' 400 -b "$JAR" -X POST "${BASE}/api/progress/preferences" -H "$JSON" -H "$ORIGIN" \
  -d '{"demoLabels":"yes"}'
check 'course bookmark and start save' 200 -b "$JAR" -X POST "${BASE}/api/progress/courses" -H "$JSON" -H "$ORIGIN" \
  -d '{"courseId":"time-series","saved":true,"started":true}'
expect_in_body 'startedAt is set by the server' '"startedAt":"20'
check 'completed modules deduplicate and sort' 200 -b "$JAR" -X POST "${BASE}/api/progress/courses" -H "$JSON" -H "$ORIGIN" \
  -d '{"courseId":"data-ethics","completedModules":[2,0,2]}'
expect_in_body 'modules stored as a sorted set' '"completedModules":\[0,2\]'
check 'course id must be a slug' 400 -b "$JAR" -X POST "${BASE}/api/progress/courses" -H "$JSON" -H "$ORIGIN" \
  -d '{"courseId":"Time Series"}'
check '__proto__ is not a course id' 400 -b "$JAR" -X POST "${BASE}/api/progress/courses" -H "$JSON" -H "$ORIGIN" \
  -d '{"courseId":"__proto__","saved":true}'
check 'unknown course field rejected' 400 -b "$JAR" -X POST "${BASE}/api/progress/courses" -H "$JSON" -H "$ORIGIN" \
  -d '{"courseId":"time-series","progress":90}'
check 'preferences survive on the next read' 200 -b "$JAR" "${BASE}/api/progress"
expect_in_body 'language persisted' '"language":"Hindi"'
expect_in_body 'course progress persisted' '"courseId":"time-series"'

printf '\n  --- progress: one account cannot see another ---\n'
check 'a second account signs up' 201 -c "$JAR2" -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Ravi Nair","email":"ravi@example.gov","password":"a quite different long passphrase"}'
check 'the second account reads its own history' 200 -b "$JAR2" "$ATTEMPTS"
expect_in_body 'and it is empty' '"attempts":\[\],"total":0'
expect_not_in_body "the other learner's attempt is not visible" 'Sampling manual'
check 'the second account has its own preferences' 200 -b "$JAR2" "${BASE}/api/progress"
expect_in_body "defaults, not the other account's Hindi" '"language":"English"'
check 'the second account saves one attempt' 201 -b "$JAR2" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" -d "$ONE_ATTEMPT"
check 'the second account clears its own history' 200 -b "$JAR2" -X DELETE "$ATTEMPTS" -H "$ORIGIN"
expect_in_body 'exactly one attempt removed' '"removed":1'
check 'the first account still has both attempts' 200 -b "$JAR" "$ATTEMPTS"
expect_in_body 'clearing is per account' '"total":2'

printf '\n  --- saved question sets ---\n'
PAPERS="${BASE}/api/papers"
SAVED_SET='{"title":"CPI brief.pdf","difficulty":"hard","questions":[{"q":"What does the CPI weight represent?","a":["Household spending share","A random number","The tax rate","The sample size"],"correct":0,"topic":"Price Indices","kind":"statement","explanation":"The passage defines the weight as a spending share.","source":"Each item carries a weight equal to its share of household spending.","sourceIndex":3}]}'
check 'saving needs a session' 401 -X POST "$PAPERS" -H "$JSON" -H "$ORIGIN" -d "$SAVED_SET"
check 'listing needs a session' 401 "$PAPERS"
check 'signed in, a set is saved' 201 -b "$JAR" -X POST "$PAPERS" -H "$JSON" -H "$ORIGIN" -d "$SAVED_SET"
expect_in_body 'the server issued the id' '"id":"pap_[0-9a-f]\{32\}"'
expect_in_body 'the topic was derived from the questions' '"topics":\["Price Indices"\]'
PAPER_ID="$(sed -n 's/.*"id":"\(pap_[0-9a-f]*\)".*/\1/p' "${DATA_DIR}/body" | head -1)"
check 'the set is listed back' 200 -b "$JAR" "$PAPERS"
expect_in_body 'one saved set' '"total":1'
expect_not_in_body 'the list does not ship the answer key' '"correct":'
check 'opening it returns the questions' 200 -b "$JAR" "${PAPERS}?id=${PAPER_ID}"
expect_in_body 'the explanation came back' 'defines the weight as a spending share'
expect_in_body 'the answer key came back, to its owner' '"correct":0'
check 'a set with three options is refused' 400 -b "$JAR" -X POST "$PAPERS" -H "$JSON" -H "$ORIGIN" \
  -d '{"title":"Broken","questions":[{"q":"Too few?","a":["one","two","three"],"correct":0}]}'
expect_in_body 'and says which field' '"invalid_input"'
check 'a set with no questions is refused' 400 -b "$JAR" -X POST "$PAPERS" -H "$JSON" -H "$ORIGIN" -d '{"title":"Empty","questions":[]}'
check "the second account cannot list the first's sets" 200 -b "$JAR2" "$PAPERS"
expect_in_body 'and sees none of its own' '"total":0'
expect_not_in_body "the other learner's paper is not visible" 'CPI brief'
check "the second account cannot open it by id" 404 -b "$JAR2" "${PAPERS}?id=${PAPER_ID}"
expect_not_in_body 'and gets no question text with the refusal' 'spending share'
check "the second account cannot delete it by id" 404 -b "$JAR2" -X DELETE "${PAPERS}?id=${PAPER_ID}" -H "$ORIGIN"
check 'the first account still has it' 200 -b "$JAR" "${PAPERS}?id=${PAPER_ID}"
check 'the owner deletes it' 200 -b "$JAR" -X DELETE "${PAPERS}?id=${PAPER_ID}" -H "$ORIGIN"
check 'and it is gone' 404 -b "$JAR" "${PAPERS}?id=${PAPER_ID}"

printf '\n  --- assessment: the paper goes out sealed ---\n'
PAPER="${BASE}/api/assessment/paper"
SUBMIT="${BASE}/api/assessment/submit"
check 'the paper needs a session' 401 "$PAPER"
check 'signed in, the paper is dealt' 200 -b "$JAR" "$PAPER"
expect_in_body 'fifteen questions' '"length":15'
expect_in_body 'five sections' '"questionsPerSection":3'
expect_in_body 'options carry their canonical id' '"options":\[{"id":"[abcd]","text":"'
# These two are the whole point of dealing a sealed paper, and they are matched with
# their quotes so prose cannot satisfy them: several scenarios use the word "correct"
# in their text, and one option ends "since the arithmetic is right".
expect_not_in_body 'no answer key in the paper' '"correct"'
expect_not_in_body 'no explanations in the paper' '"explanation"'
expect_not_in_body 'no correctOption field either' 'correctOption'
check 'the paper is read-only' 405 -b "$JAR" -X POST "$PAPER" -H "$JSON" -H "$ORIGIN" -d '{}'

printf '\n  --- assessment: the score is the server'"'"'s ---\n'
# Answer "a" to all fifteen. The key spread is b c d c b a b c d a d b a c a, so
# exactly four are right whatever order the questions and options were dealt in —
# grading is by option id, not by position. The body also claims a perfect score,
# which is the forgery this endpoint exists to make impossible.
ALL_A='{"durationSeconds":484,"correct":15,"total":15,"percent":100,"band":"strong",
  "choices":[{"question":"q1","option":"a"},{"question":"q2","option":"a"},{"question":"q3","option":"a"},
             {"question":"q4","option":"a"},{"question":"q5","option":"a"},{"question":"q6","option":"a"},
             {"question":"q7","option":"a"},{"question":"q8","option":"a"},{"question":"q9","option":"a"},
             {"question":"q10","option":"a"},{"question":"q11","option":"a"},{"question":"q12","option":"a"},
             {"question":"q13","option":"a"},{"question":"q14","option":"a"},{"question":"q15","option":"a"}]}'
check 'submitting needs a session' 401 -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" -d "$ALL_A"
check 'submitting from an untrusted origin rejected' 403 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" \
  -H 'Origin: https://evil.example.com' -d "$ALL_A"
check 'a real submission is graded and stored' 201 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" -d "$ALL_A"
expect_in_body 'the server counted four right out of fifteen' '"total":15,"correct":4,"answered":15,"percent":27'
expect_in_body 'and banded it from its own number' '"percent":27,"band":"needs-work"'
expect_not_in_body 'the 100% claimed in the body was not read' '"percent":100'
expect_in_body 'the stored attempt carries the server score' '"source":"assessment","label":"Quarterly competency check","total":15,"correct":4,"percent":27'
expect_in_body 'the paper duration was kept' '"durationSeconds":484'
expect_in_body 'every section is reported as a topic' '"topic":"Review and sign-off","competency":"leadership"'
expect_in_body 'the key arrives only with the result' '"correctOption":"'
expect_in_body 'and the explanations with it' '"explanation":"'
check 'leaving every question blank is allowed' 201 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" \
  -d '{"choices":[]}'
expect_in_body 'an omitted question is unanswered and wrong, not absent' '"total":15,"correct":0,"answered":0,"percent":0'
# Grading walks the fixed bank, not the submitted list, so a short submission cannot
# shorten the paper. Without these two the count above still reads 15 — total comes
# from the bank — while the report itself quietly drops the skipped questions.
expect_in_body 'a skipped question is still on the report' '"chosen":null,"correctOption":"'
expect_in_body 'and every topic still reported, at zero' '"correct":0,"total":3,"percent":0,"band":"needs-work"'

printf '\n  --- assessment: what a submission may contain ---\n'
check 'a question that is not on the paper rejected' 400 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" \
  -d '{"choices":[{"question":"q99","option":"a"}]}'
check 'an option that is not on the question rejected' 400 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" \
  -d '{"choices":[{"question":"q1","option":"z"}]}'
check 'the same question answered twice rejected' 400 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" \
  -d '{"choices":[{"question":"q1","option":"a"},{"question":"q1","option":"b"}]}'
check 'choices that are not a list rejected' 400 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" \
  -d '{"choices":"aaaaaaaaaaaaaaa"}'
check 'more answers than questions rejected' 400 -b "$JAR" -X POST "$SUBMIT" -H "$JSON" -H "$ORIGIN" \
  -d '{"choices":[{"question":"q1","option":"a"},{"question":"q2","option":"a"},{"question":"q3","option":"a"},{"question":"q4","option":"a"},{"question":"q5","option":"a"},{"question":"q6","option":"a"},{"question":"q7","option":"a"},{"question":"q8","option":"a"},{"question":"q9","option":"a"},{"question":"q10","option":"a"},{"question":"q11","option":"a"},{"question":"q12","option":"a"},{"question":"q13","option":"a"},{"question":"q14","option":"a"},{"question":"q15","option":"a"},{"question":"q1","option":"b"}]}'
check 'form-encoded submission rejected (CSRF control)' 415 -b "$JAR" -X POST "$SUBMIT" -H "$ORIGIN" \
  -H 'Content-Type: application/x-www-form-urlencoded' -d 'choices=q1'

printf '\n  --- assessment: it cannot be filed by hand ---\n'
check 'a posted assessment attempt is refused' 400 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"assessment","label":"Hand-filed perfect score","total":15,"correct":15,"topics":[{"topic":"Evidence and inference","competency":"inference","correct":15,"total":15}]}'
expect_in_body 'and told where to submit it instead' 'grade_on_server'
check 'a material quiz may still be posted, as it always could' 201 -b "$JAR" -X POST "$ATTEMPTS" -H "$JSON" -H "$ORIGIN" \
  -d '{"source":"material","label":"Uploaded: sampling notes","total":10,"correct":6,"topics":[{"topic":"Sampling","competency":"inference","correct":6,"total":10}]}'

printf '\n  --- analytics: the competency picture is the server'"'"'s ---\n'
ANALYTICS="${BASE}/api/analytics/competencies"
check 'analytics needs a session' 401 "$ANALYTICS"
check 'signed in, the analysis is computed' 200 -b "$JAR" "$ANALYTICS"
expect_in_body 'this account has measured competencies' '"measured":true'
expect_in_body 'the four-level scale is published, not hardcoded in the client' '"levels":\[{"id":"strong","min":80'
expect_in_body 'a competency carries its target and its gap' '"requiredScore":'
expect_in_body 'the target dataset is labelled demonstration, not official' '"custom":false'
expect_in_body 'and the note disclaims any official framework' 'not an official'
# The analysis is a rollup of counts and topic names. It must not become a second
# place the answer key or the scenario text can escape — matched with neighbours so
# the assessment's own use of the word "correct" in prose cannot satisfy them.
expect_not_in_body 'no answer key rides along with the analysis' '"correctOption"'
expect_not_in_body 'nor any explanation text' '"explanation":"'
expect_not_in_body 'nor the scenario prose' 'A state agency reports'
check 'scope=latest is accepted' 200 -b "$JAR" "${ANALYTICS}?scope=latest"
expect_in_body 'and it analyses one sitting' '"scope":"latest"'
check 'an unknown scope is refused, not silently treated as all' 400 -b "$JAR" "${ANALYTICS}?scope=banana"
expect_in_body 'and says what the scopes are' 'scope must be one of'
check 'the analysis is read-only' 405 -b "$JAR" -X POST "$ANALYTICS" -H "$JSON" -H "$ORIGIN" -d '{}'

printf '\n  --- analytics: explain, and its honest failures ---\n'
EXPLAIN="${BASE}/api/analytics/explain"
check 'explain needs a session' 401 -X POST "$EXPLAIN" -H "$JSON" -H "$ORIGIN"
check 'explain from an untrusted origin rejected' 403 -b "$JAR" -X POST "$EXPLAIN" -H "$JSON" \
  -H 'Origin: https://evil.example.com'
# The main server has no AI provider configured (AI_PROVIDER=gemini, empty key), so a
# signed-in account with real attempts gets the §13 wording — the same string the
# generation endpoint returns, and never a key.
check 'explain with no provider configured is 503' 503 -b "$JAR" -X POST "$EXPLAIN" -H "$JSON" -H "$ORIGIN"
expect_in_body 'the 503 says exactly what to configure' 'AI question generation is not configured'
expect_not_in_body 'and never echoes a key' 'AIza'
expect_in_body 'the charts survive a failed explain: the analysis rides along' '"analytics":{'

printf '\n  --- analytics: a brand-new account ---\n'
# Ravi cleared his history earlier, so he has no attempts. The analysis must be a
# valid, empty payload rather than an error, and explain must decline before it ever
# reaches the provider — there is nothing to explain, and that is a 409, not a 503.
check "the empty account's analysis is 200, not an error" 200 -b "$JAR2" "$ANALYTICS"
expect_in_body 'and it reports nothing measured' '"measured":false'
expect_in_body 'with every competency listed as not yet measured' '"unmeasured":\['
check 'explain with no attempts is 409, before any provider call' 409 -b "$JAR2" -X POST "$EXPLAIN" -H "$JSON" -H "$ORIGIN"
expect_in_body 'and says to complete an assessment first' 'Complete an assessment first'
expect_not_in_body 'a no-data refusal does not mention a key or provider' 'not configured'

printf '\n  --- brute force ---\n'
RATE_HIT=0
for i in $(seq 1 12); do
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "${BASE}/api/auth/login" -H "$JSON" -H "$ORIGIN" \
    -d '{"email":"ananya@example.gov","password":"guess number '"$i"'"}')"
  if [ "$code" = "429" ]; then RATE_HIT="$i"; break; fi
done
if [ "$RATE_HIT" != "0" ]; then
  PASS=$((PASS + 1)); printf '  ok    repeated wrong passwords blocked at attempt %s\n' "$RATE_HIT"
else
  FAIL=$((FAIL + 1)); printf '  FAIL  12 wrong passwords in a row were never rate limited\n'
fi

printf '\n  --- what actually landed on disk ---\n'
USERS_FILE="${DATA_DIR}/users.json"
ATTEMPTS_FILE="${DATA_DIR}/attempts.json"
PROFILES_FILE="${DATA_DIR}/profiles.json"
expect_not_in_file 'password is not stored in plaintext' "$USERS_FILE" 'correct horse battery staple'
expect_not_in_file 'no field named "password"' "$USERS_FILE" '"password"'
if grep -q '"passwordHash": "scrypt\$' "$USERS_FILE"; then
  PASS=$((PASS + 1)); printf '  ok    stored as a salted scrypt hash\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  passwordHash is not in scrypt format\n'
fi
expect_not_in_file 'no password appears in the server log' "$LOG" 'correct horse battery staple'

# The privacy claim, checked from the storage side. An uploaded PDF is parsed by
# pdf.js in the browser tab; these three strings were posted with the attempt and
# must not exist anywhere on disk. There is no server field that can hold them.
expect_not_in_file 'document text never reaches attempts.json' "$ATTEMPTS_FILE" 'CONFIDENTIAL-DOCUMENT-BODY'
expect_not_in_file 'question text never reaches attempts.json' "$ATTEMPTS_FILE" 'CONFIDENTIAL-QUESTION-STEM'
expect_not_in_file 'source sentences never reach attempts.json' "$ATTEMPTS_FILE" 'CONFIDENTIAL-SENTENCE'
expect_not_in_file 'no field named "text"' "$ATTEMPTS_FILE" '"text"'
expect_not_in_file 'no field named "questions"' "$ATTEMPTS_FILE" '"questions"'
expect_not_in_file 'no field named "sentences"' "$ATTEMPTS_FILE" '"sentences"'
expect_not_in_file 'no password anywhere in attempts.json' "$ATTEMPTS_FILE" 'correct horse battery staple'
# The assessment now grades on this side, so the server does hold its scenarios and
# explanations. What is stored per attempt is still only counts and topic names: a
# graded row must not carry the paper it came from.
expect_not_in_file 'assessment scenario text is not stored either' "$ATTEMPTS_FILE" 'A state agency reports'
expect_not_in_file 'nor its explanations' "$ATTEMPTS_FILE" 'artefact of the count'
expect_not_in_file 'nor which option anyone picked' "$ATTEMPTS_FILE" '"chosen"'
if grep -q '"percent": 27' "$ATTEMPTS_FILE"; then
  PASS=$((PASS + 1)); printf '  ok    the server-graded 27%% is on disk\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  attempts.json does not hold the server-graded assessment score\n'
fi
if grep -q '"percent": 60' "$ATTEMPTS_FILE"; then
  PASS=$((PASS + 1)); printf '  ok    the recomputed score is what got stored, not the posted one\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  attempts.json does not hold the recomputed percent\n'
fi

for file in "$USERS_FILE" "$ATTEMPTS_FILE" "$PROFILES_FILE"; do
  name="$(basename "$file")"
  if [ ! -f "$file" ]; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s was never written\n' "$name"
    continue
  fi
  PERMS="$(stat -c '%a' "$file" 2>/dev/null || stat -f '%Lp' "$file" 2>/dev/null)"
  if [ "$PERMS" = "600" ]; then
    PASS=$((PASS + 1)); printf '  ok    %s is owner-only (600)\n' "$name"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s permissions are %s, wanted 600\n' "$name" "$PERMS"
  fi
done

printf '\n  --- AI question generation ---\n'

# This half of the run has no AI provider configured, which is the state a fresh
# clone is in. What it proves is that the endpoint says so rather than quietly
# producing questions some other way — the §13 rule the whole feature rests on.

AI_JAR="${DATA_DIR}/ai-cookies.txt"
curl -sS -o /dev/null -c "$AI_JAR" -X POST "${BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
  -d '{"name":"Ai Tester","email":"ai.tester@mospi.gov.in","password":"correct-horse-battery-staple-42"}'

# Bodies are built by node so the document text is the real fixture rather than a
# string retyped here, which would drift from what the validator is tuned on.
BODY_DIR="${DATA_DIR}/ai-bodies"
mkdir -p "$BODY_DIR"
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const dir = process.argv[1];
const text = readFileSync("server/ai-fixtures/material.txt", "utf8");
const topics = ["Index methodology", "Sampling and non-response", "Price collection", "Data quality"];
const base = { text, topics, concepts: ["Consumer Price Index", "base year"], questionCount: 12 };
const put = (name, value) => writeFileSync(`${dir}/${name}.json`, JSON.stringify(value));
put("valid", base);
put("no-text", { ...base, text: undefined });
put("short-text", { ...base, text: "Too short." });
put("bad-topics", { ...base, topics: "not an array" });
put("bad-count", { ...base, questionCount: 9999 });
put("huge", { ...base, text: "x".repeat(300 * 1024) });
' "$BODY_DIR"

check 'AI generation without a session is 401' 401 \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/valid.json"
expect_not_in_body 'the 401 does not name the provider or a key' 'GEMINI'

check 'AI generation with no text is 400' 400 -b "$AI_JAR" \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/no-text.json"
check 'AI generation with too little text is 400' 400 -b "$AI_JAR" \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/short-text.json"
check 'AI generation with non-array topics is 400' 400 -b "$AI_JAR" \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/bad-topics.json"
check 'AI generation with an absurd question count is 400' 400 -b "$AI_JAR" \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/bad-count.json"

# §18: an oversized document must be refused at the door rather than read into
# memory, so a large upload cannot be used to exhaust the server.
check 'a 300 KB document is refused as too large' 413 -b "$AI_JAR" \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/huge.json"

check 'AI generation with no provider key is 503' 503 -b "$AI_JAR" \
  -X POST "${BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/valid.json"
expect_in_body 'the 503 says exactly what to configure' 'AI question generation is not configured'
expect_not_in_body 'and never echoes a key' 'AIza'

# §13 in its strongest form. The response does carry a questions array — the browser
# reads its length to report how far short a generation fell — so asserting the field
# is absent would be the wrong test. What must be true is that it is empty: with no
# provider configured, not one question may be produced by any other means.
if node -e '
  const parsed = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
  if (parsed.ok !== false) throw new Error("an unconfigured server reported success");
  const count = Array.isArray(parsed.questions) ? parsed.questions.length : 0;
  if (count !== 0) throw new Error(`${count} questions were returned with no provider configured`);
' "${DATA_DIR}/body" 2>"${DATA_DIR}/ai-503.log"; then
  PASS=$((PASS + 1)); printf '  ok    and not one question was generated by other means\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  the unconfigured server produced questions anyway:\n'
  sed 's/^/          /' "${DATA_DIR}/ai-503.log"
fi

# A second server, this time with the mock provider, so the success path is
# exercised over real HTTP too. It is a separate process on a separate port
# because AI_PROVIDER is read at startup.
#
# It is also given a GEMINI_API_KEY, and this is the point of the whole section.
# Every 'AIza' assertion in this file used to run against a process whose
# environment held no key at all, so they were asserting that a value which never
# existed had not escaped — green by construction, and green even if the route
# started returning process.env verbatim. The canary below is a real key-shaped
# value living in the server's environment for the duration, which turns those
# assertions into evidence. The mock provider ignores it (it is selected by
# AI_PROVIDER and configured by AI_MOCK_FILE), so no network call is made and no
# real credential is needed to prove containment.
CANARY_KEY='AIzaSyD0-smoke-canary-must-never-leave-the-server-9x'

MOCK_PORT=$((PORT + 1))
MOCK_BASE="http://127.0.0.1:${MOCK_PORT}"
MOCK_DATA="${DATA_DIR}/mock"
mkdir -p "$MOCK_DATA"

AUTH_PORT="$MOCK_PORT" \
AUTH_DATA_DIR="$MOCK_DATA" \
SESSION_SECRET="smoke_test_secret_not_used_anywhere_real_0123456789abc" \
AI_PROVIDER=mock \
GEMINI_API_KEY="$CANARY_KEY" \
AI_MOCK_FILE="$PWD/server/ai-fixtures/valid.json" \
node server/index.mjs > "${DATA_DIR}/mock-server.log" 2>&1 &
MOCK_PID=$!

for _ in $(seq 1 40); do
  curl -sS -o /dev/null "${MOCK_BASE}/api/health" 2>/dev/null && break
  sleep 0.25
done

if ! curl -sS -o /dev/null "${MOCK_BASE}/api/health" 2>/dev/null; then
  FAIL=$((FAIL + 1)); printf '  FAIL  the mock-provider server did not start\n'
  sed 's/^/          /' "${DATA_DIR}/mock-server.log"
else
  MOCK_JAR="${DATA_DIR}/mock-cookies.txt"
  curl -sS -o /dev/null -c "$MOCK_JAR" -X POST "${MOCK_BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
    -d '{"name":"Mock Tester","email":"mock.tester@mospi.gov.in","password":"correct-horse-battery-staple-42"}'

  check 'AI generation with a provider configured is 200' 200 -b "$MOCK_JAR" \
    -X POST "${MOCK_BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/valid.json"
  expect_in_body 'the paper reports which provider wrote it' '"provider": *"mock"'
  expect_in_body 'the questions carry a source passage' '"source"'
  expect_not_in_body 'and no key travels with them' 'AIza'
  expect_not_in_body 'and no provider URL is echoed' 'generativelanguage.googleapis.com'

  # The count and the answer-key range are what the quiz UI assumes; a paper that
  # violated either would render but mark the learner wrongly.
  if node -e '
    const body = require("node:fs").readFileSync(process.argv[1], "utf8");
    const parsed = JSON.parse(body);
    if (parsed.ok !== true) throw new Error("response was not ok");
    if (!Array.isArray(parsed.questions) || parsed.questions.length < 10) {
      throw new Error(`only ${parsed.questions ? parsed.questions.length : 0} questions`);
    }
    for (const q of parsed.questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error("wrong option count");
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) throw new Error("bad answer key");
      if (typeof q.source !== "string" || q.source.trim() === "") throw new Error("missing source");
    }
  ' "${DATA_DIR}/body" 2>"${DATA_DIR}/ai-shape.log"; then
    PASS=$((PASS + 1)); printf '  ok    every question is 4 options with an in-range answer key\n'
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  the generated paper is not the shape the quiz expects:\n'
    sed 's/^/          /' "${DATA_DIR}/ai-shape.log"
  fi

  # The startup banner has to make a mock run obvious, or a demo could be given
  # on canned questions while everyone present believes they are watching AI.
  if grep -qi 'mock' "${DATA_DIR}/mock-server.log"; then
    PASS=$((PASS + 1)); printf '  ok    the server warns at startup that the provider is mocked\n'
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  a mocked provider starts up without saying so\n'
  fi

  # §3/§18 the containment claim, swept rather than spot-checked.
  #
  # A key in the environment can escape through more than the one response body a
  # test happens to look at: a header, an error page, a status endpoint, the 404
  # handler, a stack trace on a malformed request. Every reachable endpoint is
  # requested here — success paths and failure paths — and both the headers and the
  # body of each are searched for the canary. Failure paths matter more than the
  # success path, because they are where a framework is most likely to hand back
  # something it assembled itself.
  SWEEP_LEAKS=0
  SWEEP_COUNT=0
  sweep() {
    local label="$1"; shift
    SWEEP_COUNT=$((SWEEP_COUNT + 1))
    curl -sS -D "${DATA_DIR}/sweep-head" -o "${DATA_DIR}/sweep-body" "$@" >/dev/null 2>&1 || true
    if grep -qF "$CANARY_KEY" "${DATA_DIR}/sweep-head" "${DATA_DIR}/sweep-body" 2>/dev/null \
      || grep -qE 'AIza[0-9A-Za-z_-]{10,}' "${DATA_DIR}/sweep-head" "${DATA_DIR}/sweep-body" 2>/dev/null; then
      SWEEP_LEAKS=$((SWEEP_LEAKS + 1))
      printf '          leaked via %s\n' "$label"
    fi
  }

  sweep 'GET /api/health'            "${MOCK_BASE}/api/health"
  sweep 'GET /api/health (no auth)'  -H "$ORIGIN" "${MOCK_BASE}/api/health"
  sweep 'GET /api/auth/me'           -b "$MOCK_JAR" "${MOCK_BASE}/api/auth/me"
  sweep 'GET a route that does not exist' "${MOCK_BASE}/api/does-not-exist"
  sweep 'GET /api/ai/generate-mcqs (wrong method)' -b "$MOCK_JAR" "${MOCK_BASE}/api/ai/generate-mcqs"
  sweep 'POST generate-mcqs, success' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/valid.json"
  sweep 'POST generate-mcqs, no session' -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/valid.json"
  sweep 'POST generate-mcqs, no text' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/no-text.json"
  sweep 'POST generate-mcqs, short text' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/short-text.json"
  sweep 'POST generate-mcqs, bad topics' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/bad-topics.json"
  sweep 'POST generate-mcqs, oversized' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/huge.json"
  sweep 'POST generate-mcqs, not JSON at all' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" -H "$ORIGIN" --data-binary 'this is not json {{{'
  sweep 'POST generate-mcqs, no origin header' -b "$MOCK_JAR" -X POST "${MOCK_BASE}/api/ai/generate-mcqs" \
    -H "$JSON" --data-binary "@${BODY_DIR}/valid.json"

  if [ "$SWEEP_LEAKS" -eq 0 ]; then
    PASS=$((PASS + 1))
    printf '  ok    the key in the environment reached none of %s swept responses\n' "$SWEEP_COUNT"
  else
    FAIL=$((FAIL + 1))
    printf '  FAIL  the API key escaped through %s of %s responses\n' "$SWEEP_LEAKS" "$SWEEP_COUNT"
  fi

  # And the sweep itself has to be able to fail, or the line above is decoration.
  # A file seeded with the canary must trip exactly the same grep.
  printf 'x-leaked-key: %s\n' "$CANARY_KEY" > "${DATA_DIR}/sweep-head"
  : > "${DATA_DIR}/sweep-body"
  if grep -qF "$CANARY_KEY" "${DATA_DIR}/sweep-head" "${DATA_DIR}/sweep-body" 2>/dev/null; then
    PASS=$((PASS + 1)); printf '  ok    and the sweep does detect the canary when it is present\n'
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  the sweep cannot see the canary even when it is there\n'
  fi

  kill "$MOCK_PID" 2>/dev/null
  wait "$MOCK_PID" 2>/dev/null
fi

# A third server, on the local provider, pointed at a port with nothing behind it.
#
# This is the single most likely thing to go wrong on a machine using a local model:
# everything is configured correctly and Ollama simply is not running. The point is that
# the failure must stay honest — a 502 that names the problem, and an empty questions
# array. A local model is "configured" the moment an address is valid, which is a
# different state from "reachable", and conflating the two would tell someone to add an
# API key that the local path does not have or need.
LOCAL_PORT=$((PORT + 2))
# Nothing in this script ever binds PORT+3, which is the whole point of it: the local
# provider is aimed at a port that is guaranteed to refuse the connection.
DEAD_PORT=$((PORT + 3))
LOCAL_DATA="${DATA_DIR}/local-run"
LOCAL_BASE="http://127.0.0.1:${LOCAL_PORT}"
mkdir -p "$LOCAL_DATA"

AUTH_PORT="$LOCAL_PORT" \
AUTH_DATA_DIR="$LOCAL_DATA" \
SESSION_SECRET="smoke_test_secret_not_used_anywhere_real_0123456789abc" \
AI_PROVIDER=local \
AI_LOCAL_URL="http://127.0.0.1:${DEAD_PORT}/v1" \
AI_LOCAL_TIMEOUT_MS=4000 \
GEMINI_API_KEY= \
node server/index.mjs > "${DATA_DIR}/local-server.log" 2>&1 &
LOCAL_PID=$!

for _ in $(seq 1 40); do
  curl -sS -o /dev/null "${LOCAL_BASE}/api/health" 2>/dev/null && break
  sleep 0.25
done

if ! curl -sS -o /dev/null "${LOCAL_BASE}/api/health" 2>/dev/null; then
  FAIL=$((FAIL + 1)); printf '  FAIL  the local-provider server did not start\n'
  sed 's/^/          /' "${DATA_DIR}/local-server.log"
else
  LOCAL_JAR="${DATA_DIR}/local-cookies.txt"
  curl -sS -o /dev/null -c "$LOCAL_JAR" -X POST "${LOCAL_BASE}/api/auth/signup" -H "$JSON" -H "$ORIGIN" \
    -d '{"name":"Local Tester","email":"local.tester@mospi.gov.in","password":"correct-horse-battery-staple-42"}'

  check 'a local model that is not running is 502, not 503' 502 -b "$LOCAL_JAR" \
    -X POST "${LOCAL_BASE}/api/ai/generate-mcqs" -H "$JSON" -H "$ORIGIN" --data-binary "@${BODY_DIR}/valid.json"
  expect_in_body 'and the message says to check Ollama' 'Ollama'
  expect_not_in_body 'and does not send anyone hunting for an API key' 'not configured'

  if node -e '
    const parsed = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
    if (parsed.ok !== false) throw new Error("an unreachable model reported success");
    const count = Array.isArray(parsed.questions) ? parsed.questions.length : 0;
    if (count !== 0) throw new Error(`${count} questions were returned with no model running`);
  ' "${DATA_DIR}/body" 2>"${DATA_DIR}/ai-local.log"; then
    PASS=$((PASS + 1)); printf '  ok    and not one question was invented in its absence\n'
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  an unreachable local model still produced questions:\n'
    sed 's/^/          /' "${DATA_DIR}/ai-local.log"
  fi

  # The banner has to name the address it will call, because "pointed at the wrong port"
  # and "Ollama is down" look identical from the browser and are told apart only here.
  if grep -q "127.0.0.1:${DEAD_PORT}" "${DATA_DIR}/local-server.log"; then
    PASS=$((PASS + 1)); printf '  ok    the startup banner names the local model address\n'
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  the banner does not say where the local model is expected\n'
  fi

  kill "$LOCAL_PID" 2>/dev/null
  wait "$LOCAL_PID" 2>/dev/null
fi

# §22: the server may log diagnostics, but never the key itself. The mock server above
# ran with $CANARY_KEY in its environment and printed a startup banner naming the
# provider and the model, so this now checks a log written by a process that genuinely
# had a key to spill.
if grep -qE 'AIza[0-9A-Za-z_-]{10,}' "$LOG" "${DATA_DIR}/mock-server.log" "${DATA_DIR}/local-server.log" 2>/dev/null \
  || grep -qF "$CANARY_KEY" "$LOG" "${DATA_DIR}/mock-server.log" "${DATA_DIR}/local-server.log" 2>/dev/null; then
  FAIL=$((FAIL + 1)); printf '  FAIL  an API key was printed to the server log\n'
  grep -nE 'AIza[0-9A-Za-z_-]{10,}' "$LOG" "${DATA_DIR}/mock-server.log" "${DATA_DIR}/local-server.log" 2>/dev/null | sed 's/^/          /'
else
  PASS=$((PASS + 1)); printf '  ok    no API key was printed to any server log\n'
fi

printf '\n  --- taxonomy drift ---\n'
if node server/taxonomy-check.mjs > "${DATA_DIR}/taxonomy.log" 2>&1; then
  PASS=$((PASS + 1)); printf '  ok    server/progress.mjs still agrees with src/lib/topics.ts\n'
else
  FAIL=$((FAIL + 1)); printf '  FAIL  server and app taxonomies have drifted:\n'
  sed 's/^/    /' "${DATA_DIR}/taxonomy.log"
fi

printf '\n  --- stored record ---\n'
sed 's/^/    /' "$USERS_FILE"

printf '\n  ========================================\n'
printf '  %s passed, %s failed\n\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
