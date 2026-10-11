# 0002: Run one SQLite task in the practice worker

Status: Accepted

## Context

Database practice must work in browser-only development and must never open the learner progress database. The existing worker owns cancellation, stale-result rejection, and a five-second deadline. Bundle limits must remain unchanged.

## Decision

Use pinned sql.js 1.13.0, SQLite compiled to WASM, for exactly one stock-transfer rep. Its documented in-memory Database API and locateFile hook support local assets: https://sql.js.org/documentation/global.html and https://github.com/sql-js/sql.js/ . Vite emits the WASM asset from a package URL import. The worker dynamically imports the loader only for this rep; worker output uses ES modules to preserve that lazy boundary. No CDN or server API is needed.

Each authored check creates, seeds, queries, and closes a fresh database. Learners receive only synchronous run/query methods, not filesystem or persistence access. A duplicate audit key fails after two updates, exercising real rollback behavior. The existing Explain/Review flow contains the authored reasoning, trace, alternative, counterexample, and transfer challenge.

Node's built-in SQLite cannot run in browser-only mode. A server-backed runner would break that constraint and introduce a progress-data boundary. A mock SQL interpreter would not establish real SQLite semantics. sql.js supplies the required engine with one dependency and no new service.

## Consequences and verification

The JavaScript budget checker now follows worker chunk references, including lazy SQL JavaScript, rather than counting only worker entry files. Limits are unchanged. Measured worker JavaScript including the SQL loader is 11,251,596 raw bytes and 2,688,822 gzip bytes, under 11,400,000 and 3,100,000 respectively. The WASM binary is 659,806 raw bytes (322,711 gzip); existing budgets apply to JavaScript, so the binary is recorded separately in the performance guide. The initial route does not import the loader. The worker reports when the engine has loaded. Loading gets a separate 30-second allowance (so a cold or busy start is not reported as an endless loop); learner code and checks then keep the usual five-second limit. Cancellation terminates the worker.

Node tests use the same engine and verify result rows, rollback failures, repeated fresh checks, and cleanup. A Chromium test uses browser-only Vite, real Monaco, real WASM worker checks, review, and completion. These checks do not establish disk durability, concurrency safety, other engines, disconnected operation, or learning effectiveness. The worker remains a personal-practice environment, not secure isolation for arbitrary third-party code.
