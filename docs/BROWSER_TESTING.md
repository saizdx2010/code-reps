# Browser-flow tests

The Playwright suite complements the Node tests with real Chromium, Monaco, and browser-worker execution. Requires the same Node.js 24+ and Yarn Classic 1.22.22 as the app.

```sh
yarn install --frozen-lockfile
yarn playwright install chromium
yarn test:e2e
```

On Linux CI, use `yarn playwright install --with-deps chromium` to install browser system dependencies too. Browser installation requires a download; running the installed suite uses local assets.

Playwright first builds current assets, including bundle-size checks, then starts its own loopback Vite server at `http://127.0.0.1:4175`. The port must be free: the suite deliberately refuses to reuse an existing server. Each test gets a fresh browser context. Practice tests use browser-local learner data. SQLite tests start the actual local service on a random loopback port with a unique temporary data directory per test, and cleanly stop it and remove that directory afterward. They never reuse a learner server or touch `~/.code-reps`.

Use `E2E_PORT=4203 yarn test:e2e` to select another dedicated port. Ordinary assertions default to 10 seconds in local runs and CI; `E2E_EXPECT_TIMEOUT` can override that timeout in milliseconds (a positive integer). Exact check-result assertions use the shared `expectChecksFinished` helper with a named 30-second completion timeout for worker startup and Monaco compilation under load. Assertions still require the expected result text, and the suite has no retries. The overall test timeout remains 45 seconds.

## Coverage

- Verify local TypeScript member suggestions and editor Find after narrowing imports.
- Edit through real Monaco keyboard input, run worker checks with the keyboard shortcut, clear stale feedback after an edit, and check failing feedback.
- Reload and restore a saved plan and executable code draft.
- Create and switch local profiles, verify a fresh profile starts without the original draft, and recover the original profile's work.
- Switch practice steps and task/code panes at a 390px viewport, preserve the plan, run checks, exit the editor with Tab, and check for page overflow.
- Choose and revise a first-run starting point, preserve it on reload, and navigate back from the recommended rep.
- Open failed checks one at a time with the keyboard, keeping structured input and value comparisons.
- Follow the practice steps through missing requirements, explanation, reflection, completion, and reload. An unhinted solve before its guided journey must not establish independence.
- Navigate lesson sections, preserve checked predictions and self-review evidence on reload, and select a path through the narrow-screen chooser.
- Use app-owned dropdowns with label clicks, arrow keys, typeahead, Escape cancellation, Tab selection, and reload persistence; verify their popup fits a narrow viewport and opens inside the Profiles dialog.
- Navigate the history calendar across month boundaries and leap days, cancel without changing the filter, select and reload a date, and clear it.
- Exercise number limits and empty-field recovery, search clearing and focus restoration, keyboard-operated styled choices, tooltip dismissal, and failed file-import recovery through the custom file button.

- Stop and edit an endless worker run, reject obsolete feedback after its deadline, recover from the real five-second timeout, and run a corrected draft.
- Fail the editor module request, recover the existing draft through the plain text editor, run checks, and restore Monaco with the edited draft after reload.
- Exercise frontend preview states, filtering, Retry, viewport selection, modal Escape/focus restoration, stale preview feedback, and real sandboxed-frame checks/cleanup.
- Choose a track as your goal explicitly at 1280px and 320px, preserve it on reload, and keep early recall accessible without claiming retention.
- Confirm no session controls appear in the workspace, Home, or Journal, that `#/sessions` redirects to the Journal, and that legacy session records in a learner backup still import into SQLite using temporary service data.
- With actual SQLite, fail writes, export the cached work, replay pending saves after reload, retry, restart the service, and restore through a clean browser context. Delay an older acknowledgement while a newer edit is pending.
- Reject malformed browser imports without replacing work, then restore a valid backup into a separate profile and verify SQLite persistence.
- Block every external HTTP request during a cold local-server flow and exercise Monaco, worker checks, previews, and frontend checks. This tests the local assets for those flows while loopback remains available.
- Complete the validation journey, reject early retention, start fresh delayed recall, and discover its further batch application. Preserve work and keyboard editor exit at 320 CSS pixels with reduced motion.
- Attach local Home/editor readiness measurements and the build's bundle report. Timings are observations, not a speed threshold on shared CI machines.

The tests use authored fixture code through the visible editor, without mocking Monaco, worker checks, or persistence. Tests are independent and run without retries so failures remain visible.

## Debugging

```sh
yarn test:e2e --headed
yarn test:e2e --debug
yarn test:e2e --grep 'reload'
yarn playwright show-report
```

Failures retain screenshots and traces under `test-results/`. The HTML report is under `playwright-report/`. Both directories are ignored by Git. Open a failure trace with `yarn playwright show-trace <trace-file>`.

This suite does not verify every storage-failure or upgrade case, disconnected operation across the entire app, OS-level network disconnection, Firefox/WebKit, other operating systems, browser zoom, or assistive-technology support. The external-request test covers specific flows with a running loopback server; it does not make the app available after that server stops. Narrow layout assertions are functional checks, not screenshot or visual-design approval. Keep the existing Node suite and manual release walkthroughs; browser tests do not establish learning effectiveness.

Configuration: `playwright.config.ts`. Tests: `tests/e2e/*.spec.ts`; shared editor helpers: `tests/e2e/helpers.ts`. Pull requests and pushes to main run the suite through `.github/workflows/checks.yml`, retaining failure reports for seven days. `yarn test` and `just check` do not run this suite; run `yarn test:e2e` explicitly for affected browser flows.

See [performance measurements](./PERFORMANCE.md) and [the remaining accessibility/learner walkthrough](./ACCESSIBILITY_REVIEW.md) for their specific evidence boundaries.

See [daily-practice verification](./DAILY_PRACTICE_VERIFICATION.md) for the stage 3 results, stage 4 findings, and pending learner gates.
