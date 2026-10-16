# Maintaining Code Reps without an AI assistant

This playbook covers routine maintenance: the daily loop, adding reps and lessons, the checks that gate changes, common failures, merging parallel branches, and backups. Read [content authoring](./CONTENT_AUTHORING.md) for the standards behind each content step, and [local setup](./LOCAL_SETUP.md) for how learners run the app.

Requirements: **Node.js 24+** and **Yarn Classic 1.22.22**. Install dependencies from the lockfile:

```sh
yarn install --frozen-lockfile
```

## Daily development loop

1. Check your starting point: `git status --short` and `git branch --show-current`. Preserve any uncommitted work you did not make.
2. Start the app with `yarn dev`. It saves learner work in the browser and needs no SQLite service.
3. Run the focused test for the file you changed, for example `node --experimental-strip-types --test tests/content.test.mjs`.
4. Before committing, run the gates that match the change (see the next section). For most source changes that is `yarn lint`, `yarn test`, and `yarn build`.
5. Finish with `git diff --check`, and read `git diff` for unrelated edits.

To try the production-like local app with SQLite, run `yarn build` then `yarn serve`. It binds to `127.0.0.1:4173` by default. Use `yarn preview` only to look at the Vite build; it does not start the SQLite service.

## What each gate catches

| Command | What it catches | When to run |
| --- | --- | --- |
| `yarn lint` | Oxlint findings across the project, using the rules in `.oxlintrc.json`, then an oxfmt format check (`.oxfmtrc.json`; `yarn format` fixes it) | Every source change |
| `yarn test` | Node tests: the catalog index is current, each rep has a level, paths keep their reps, references pass their checks, storage and backup contracts hold, and more | Every source change |
| `yarn build` | TypeScript errors (`tsc -b`), Vite build failures, and JavaScript bundle budgets (`scripts/check-bundle.mjs`) | Every source change |
| `yarn content:index` | Not a gate: it regenerates `src/catalog-index.ts` after you change a rep or lesson | After any rep or lesson change |
| `yarn content:check` | Authored content: required rep fields, duplicate IDs, missing self-review guides, lesson and depth coverage, recall variants, and project rubrics | Any content change, and before a release |
| `yarn test:e2e` | Real Chromium flows: Monaco editing, worker checks, stale feedback, draft reloads, profile separation, and narrow-pane navigation | Changes to practice, editors, navigation, profiles, or persistence |
| `git diff --check` | Whitespace errors and conflict markers | Before every commit |
| `yarn package` then `node scripts/verify-portable.mjs` | The portable bundle starts, saves, restarts, and shuts down cleanly | Changes to packaging or the local server |

`just check` runs lint, build, tests, and `yarn content:check`; `just check-all` also runs `yarn test:e2e`. CI (`.github/workflows/checks.yml`) runs the same gates, including the browser suite.

Passing tests do not prove that a prompt is clear, that a check matches the contract, or that the app is accessible. Read new prompts as someone new to the terminology, and try them in `yarn dev`.

## Adding a rep, end to end

Start with the skeletons. This prints code to paste and writes nothing:

```sh
yarn rep:new <rep-id> <module-file>
# example
yarn rep:new sum-evens src/foundations.ts
```

The command checks that the ID is kebab-case (lowercase letters and digits joined by single hyphens, starting with a letter), that no rep already uses it, and that the module is a `.ts` file directly in `src/`. It refuses `review-*.ts` files because those hold depth and guides, not reps. Rep IDs are saved keys, so once a rep ships its ID never changes.

The output has five blocks, in order:

1. **Rep object**: paste into the rep array exported by the module. Replace every `TODO`. The required fields are listed in the `Rep` type in `src/rep-types.ts`.
2. **Depth entry**: `reasoning`, `trace`, `alternative`, `counterexample`, and `transfer`. Add it to the matching `src/review-*.ts` depth export; the review registry aggregates it.
3. **Self-review guide**: `plan`, `explanation`, and `example`. Add it to the matching `src/review-*.ts` module. `yarn content:check` fails without it.
4. **Reference solution**: a complete independent implementation in `tests/fixtures/`. Use the fixture file for your module, for example `tests/fixtures/foundations-solutions.mjs`. If you create a new fixture file, add it to the spread in `tests/content.test.mjs`.
5. **Follow-up checklist**: the steps below, in the same order.

Then work through the checklist:

- [ ] Add the rep to a stage in `src/path.ts` if it belongs on a path. Add its difficulty to `repLevels` in `src/rep-levels.ts` (1 Beginner, 2 Intermediate, 3 Advanced). `yarn test` names any rep without a level.
- [ ] Add an Indonesian gloss for every vocabulary term in `indonesianGlossary` in `src/vocabulary-id.ts`. See [the glossary rule](#the-indonesian-glossary-rule).
- [ ] If the module is new, list it in `src/rep-sources.ts` and run `yarn content:index`, which regenerates the lazy loaders in `src/rep-chunks.ts`. Existing modules are already registered.
- [ ] `yarn content:index` to regenerate `src/catalog-index.ts`.
- [ ] `yarn content:check` for the content rules.
- [ ] `node --experimental-strip-types --test tests/content.test.mjs` to confirm the reference solution passes every check.
- [ ] `yarn lint`, `yarn test`, and `yarn build`.
- [ ] Try the rep in `yarn dev`, then read the prompt as a new learner.

Authoring standards that the skeletons do not enforce:

- The prompt states normalization, precedence, mutation rules, character sets, and input limits where they change the answer. Checks must match the written contract.
- Hints give progressively more help without revealing the full answer.
- Independent and recall prompts contain no solution clues.
- Set `preserveInput: true` when the contract forbids changing inputs.
- Output checks cannot prove the learner used a particular declaration or approach. Put that in the self-review.

## Adding a lesson

A knowledge lesson is a skill in `src/knowledge.ts`. It needs a stable ID, objectives, prerequisites, a plain explanation, a worked example and trace, common mistakes, two interactive checks, the related exercise IDs, and links to related skills. Follow [content authoring](./CONTENT_AUTHORING.md#knowledge-lessons-and-fluency-evidence) for the full contract.

Then:

1. Register a depth entry in `src/lesson-depth.ts`. It holds a concrete example, causal reasoning, a challenge, and a separately revealed answer. Put the entry in a `src/review-*.ts` module when one fits the area.
2. If the lesson sits beside a rep in a content module, add its `lessons` entry to that module's source in `src/rep-sources.ts`. A lesson must live in the same source as its rep, or `yarn content:index` throws.
3. Run `yarn content:index`, then `yarn content:check`, then `yarn test`.

Keep startup modules light. Put heavy review text in `src/review-*.ts`, not in `src/knowledge.ts` or `src/catalog-index.ts`.

## Regenerating the catalog index

`src/catalog-index.ts` is generated. Never edit it by hand. Run:

```sh
yarn content:index
```

Run it after any change to a rep's ID, title, category, starter, hints, checks, or the list of lessons. `tests/catalog-index.test.mjs` fails with "Run `yarn content:index`" when the file is stale.

## The Indonesian glossary rule

Every vocabulary term on a rep needs a gloss in `indonesianGlossary` in `src/vocabulary-id.ts`:

- The key is the **exact English term** as written in the rep's `vocabulary` array, including case and spacing.
- The gloss is a short plain-language meaning, not a sentence translation. English stays the primary text.
- Remove or rename a glossary key when you remove or rename its term. `tests/vocabulary-id.test.mjs` fails for missing glosses and for unused keys.

## Common failures and fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| `yarn test` fails in `catalog-index.test.mjs`: "Run `yarn content:index`" | You changed a rep or lesson but did not regenerate the index, or a merge left it stale | `yarn content:index`, then review and commit `src/catalog-index.ts` |
| `vocabulary-id.test.mjs` lists a missing term | A new vocabulary term has no gloss | Add the exact term to `indonesianGlossary` in `src/vocabulary-id.ts` |
| `vocabulary-id.test.mjs` lists an unused key | A term was renamed or removed | Delete or rename the glossary key to match |
| `yarn build` fails with "Bundle budget exceeded: Initial JavaScript" (or another group) | A startup module imported heavy content or a review module | Find the import chain from `src/main.tsx`. Move the content into a rep-content, lesson, or `src/review-*.ts` module loaded on demand. After `yarn build`, `dist/bundle-size.json` lists the size of each group |
| `yarn build` fails with "Unused language workers were bundled" | An extra worker was pulled in by a dependency | Check the imports that added the worker before changing the budget |
| `yarn test:e2e` fails to start the server, or Vite reports the port is in use | Port 4175 is busy. The Playwright server uses `--strictPort`, so it will not pick another port | Run `E2E_PORT=4207 yarn test:e2e` (any free port). Use a different `E2E_PORT` for each checkout you test side by side |
| `yarn content:check` reports "missing self-review" | No self-review guide in the matching `src/review-*.ts` module | Add the `plan`, `explanation`, and `example` guide for that rep |
| `yarn content:check` reports "missing ... " for a field | A required field is empty | Fill the field. Required fields: `title`, `category`, `prompt`, `note`, `planPrompt`, `starter`, `functionName` |
| `yarn content:check` reports "missing or duplicate checks" | No checks, or two checks share a name | Give every check a unique name |
| `yarn content:check` reports "Exercise IDs must be unique." | Two reps share an ID, often after copying a rep | Rename the new rep with a fresh, stable ID |
| `yarn content:check` reports a `missing preparation rep` or incomplete external project | A project refers to a rep that does not exist | Fix the reference or add the rep |
| `tests/rep-levels.test.mjs` names reps | A rep has no entry in `repLevels` | Add a 1, 2, or 3 in `src/rep-levels.ts` |
| `tests/content.test.mjs` fails for one rep | The reference solution in `tests/fixtures/` does not match the checks, or a fixture key is misspelled | Fix the fixture, or fix the check if the contract is wrong. Do not weaken the check |
| `yarn lint` or `yarn build` fails after a merge | A conflict was resolved incorrectly | Read the file around the merged lines, then rerun the gate |

## Merging parallel branches

Parallel content branches often edit the same generated and registry files.

- **`src/catalog-index.ts` conflicts: regenerate, do not hand-merge.** Take either side of the conflicted file (for example `git checkout --ours -- src/catalog-index.ts`), then run `yarn content:index`, `git add src/catalog-index.ts`, and continue the merge. The generated output depends on the final catalog, so hand edits are wrong even when they look plausible.
- **Registry conflicts (`src/rep-sources.ts`, `src/path.ts`, `src/rep-levels.ts`, `src/vocabulary-id.ts`, and the review registries) are hand-merged.** Keep both sides' entries, then regenerate `src/catalog-index.ts` and `src/rep-chunks.ts` with `yarn content:index` instead of merging them. Check for duplicate keys, and check the lists are in the order the file expects.
- **After any merge that touches content:** run `yarn content:index`, `yarn content:check`, `yarn test`, `yarn lint`, and `yarn build`. A clean textual merge can still break a rep ID, a glossary key, or a level.
- Give each parallel checkout its own `E2E_PORT` if you run the browser suite at the same time.

## Backups and data

Learner data is local. Know where it lives before you release, reset, or move anything.

| Data | Location | Notes |
| --- | --- | --- |
| SQLite progress | `~/.code-reps/progress.sqlite` (plus `-wal` and `-shm` files) | The local server writes here. Override the folder with `CODE_REPS_DATA_DIR` |
| SQLite snapshots | `~/.code-reps/backups` | The server takes one on restart and once every 24 hours; seven dated snapshots are kept |
| Learner JSON backup | **Progress → Download backup** in the app | The portable way to move work between machines. Import with **Progress → Import backup**, then confirm the preview |
| Browser copy | The browser's own storage for the same address and port | Used before the server saves. Changing the port hides it, so keep the port stable |
| Portable bundle | `release/code-reps-<platform>-<arch>` after `yarn package` | Git-ignored. Built output, not learner data |

### Size limits

`server/storage-keys.mjs` holds the limits the browser store, the server, and import share, so anything that saves can also export and restore. One saved value may hold up to 10,000,000 characters; the browser's storage quota (a few million characters per site) is normally reached first, and the app then says browser storage is full and offers a backup. The browser sends saves in requests of at most 500 keys, starting a new request at about 4 MB, and the server refuses a body over 64 MB. Backup and profile files are limited to 20 MB (`src/portability.ts`), and export reads each file back with the import parser before downloading it, so a file that would not restore is refused with the reason instead of written.

### Retired practice-session records

Practice sessions were retired from the interface, but their data contract is still read. `code-reps:sessions:v1` (`src/practice-sessions.ts`) is a profile-scoped, versioned object with a revision token and session records; each record has a stable session ID, rep ID, start date, reflection, and hint count, with an optional end date, difficulty, and completed-attempt ID. It accepts at most 1,000 records, 2,000 characters per reflection, and 800,000 serialized UTF-8 bytes. Learner backups may carry an optional `sessions` field and full-profile files may carry `sessions:v1`; both are validated on import (`src/portability.ts`, `src/profile-backup.ts`), and invalid session data rejects the import before anything is replaced. Older files without sessions remain valid. The app no longer creates or shows these records, and they never counted toward completion, streaks, independence, retention, or recall scheduling. Keep this contract readable until a deliberate migration removes it. The original design is [archived](./archive/DAILY_SESSION_DESIGN.md).

Rules for maintainers:

- Before a risky local change to the data, stop the server and copy the whole `~/.code-reps` folder somewhere safe. Restore only into a temporary `CODE_REPS_DATA_DIR` first.
- Do not experiment on your real progress database. Use a temporary directory with `CODE_REPS_DATA_DIR=$(mktemp -d)` for server or restore checks.
- Test packaging with `yarn package` and then `node scripts/verify-portable.mjs`. The script copies the bundle to a temporary folder, starts it with a temporary data directory, saves, restarts, and shuts it down. A local pass covers only the platform you ran it on. The portable workflow in `.github/workflows/portable-bundles.yml` covers Linux, macOS, and Windows.
- Verify the restore path with the [local setup guide](./LOCAL_SETUP.md#restore) before you tell learners how to recover.

## Verification boundaries

Automated checks do not establish learning effectiveness, full disconnected-browser operation, other browser engines, cross-platform packaging beyond what you ran, visual fidelity, or assistive-technology support. See [browser testing](./BROWSER_TESTING.md) and [local reliability](./LOCAL_RELIABILITY.md) for what the automated suites cover and what still needs a manual check.
