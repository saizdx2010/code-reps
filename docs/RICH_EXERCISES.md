# Richer exercises

The catalog now contains 34 reps, including five complete small tasks across the Frontend and Backend tracks. Existing rep IDs and saved-attempt formats are unchanged.

| Rep | Learner work | Checks |
| --- | --- | --- |
| Debug a checkout total | Trace a bug report, repair quantities, availability, and discounts. | Normal totals, discount boundaries, free/zero-unit items, and input preservation. |
| Trace a batch label pipeline | Predict four named inputs before checking; explain the loop, trim, and Set. | Predicted results; reasoning remains self-reviewed. |
| Build an interactive directory | Implement browser DOM elements, search events, and request states. | Nine DOM checks for precedence, Retry, filtering, clearing search, labels, list semantics, safe text, and input preservation. |
| Implement a ticket list handler | Validate parsed requests, filter tickets, count, and page a response. | Method and query errors, defaults, boundaries, filtering, total-before-pagination, empty results, and input preservation. |
| Refactor a stock summary | Improve working code while preserving order, duplicates, zero units, and totals. | Regression checks; readability and structure remain self-reviewed. |

Every task has a context, contract, starter, progressive hints, planning prompts, and an authored post-check comparison. The directory and ticket handler also appear in the Frontend and Backend tracks.

## Frontend runtime

`mountDirectory(root, state)` receives a DOM root and a supplied state. The learner builds real elements and event listeners in `solution.ts`. The preview offers ready, loading, error, and empty scenarios. Update preview executes the current code; edits show a stale-preview notice. Close preview removes the frame. Retry reports callback invocations without making a network request.

The interaction runner mounts each case into a cleared root, dispatches input/click events, and inspects the DOM and callbacks. Authored `data-testid` values define the observation contract. Search must have an associated label; names must remain literal text inside list items. The runner checks mutation visible after the interactions.

Both preview and checks use an iframe with `sandbox="allow-scripts"`, without same-origin, popup, or top-navigation permissions. A frame content policy blocks network resources. The parent accepts feedback only from the expected frame and run token. Cancelling, timing out, or finishing removes the check frame and its listener; old messages cannot update the current results. Only complete, well-shaped check feedback is accepted.

The frontend frame has a five-second response timeout, but browser-frame code does not have the worker's independent termination guarantee. A synchronous endless loop can block the browser before Stop or Close can act. This remains a personal-practice runner, not a supported boundary for imported third-party exercise code. The checks do not prove visual quality, full accessibility, or honest independent reasoning.

### DOM and accessibility reps

Reps that set `domPreview` (see `src/dom-reps.ts`) reuse the same frame, token, timeout, and cleanup, but check an authored attribute-and-behavior contract instead of the directory contract. A check supplies `props` and ordered `steps` (`type`, `click`, `focus`, `key`, `submit`, `mark`) and lists observations by `data-testid` (text, attributes, properties, label, `aria-describedby` targets, focus, element identity). Steps run against the learner's real DOM inside the sandbox; keys are dispatched as `keydown` events on the focused element and `submit` dispatches a submit event on the form.

These checks establish the stated ARIA, focus, and behavior contract only. They do not prove screen-reader announcements, visual design, or native key handling in other browsers; every rep says so and lists manual review steps. The checks frame is rendered offscreen (not `display:none`) because browsers cannot focus elements in a non-rendered frame.

## Backend runtime

The ticket exercise tests a pure request handler with parsed request objects in the existing worker. It does not start an HTTP service, parse URL query strings, or create a database. This makes the stated handler contract playable offline while keeping network/service setup outside this rep's scope.

## Verification

Lint, build/typecheck, and all 65 tests pass. DOM tests use jsdom to exercise the same generated frame script; transport tests cover source/token matching, cleanup, cancellation, timeout, and malformed feedback.

A Safari smoke test passed all nine directory checks, exercised live search and its empty result, invoked the preview Retry callback, and completed the rep. The completed attempt was verified through the local state API using a temporary test data directory. Broader browser, mobile, assistive-technology, and cross-platform verification remains pending.
