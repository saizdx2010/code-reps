# Local reliability verification

The local reliability implementation is complete for this internal pass. Cross-platform release validation remains pending.

## Verified on macOS arm64

- Pending writes survive failed requests and are replayed before startup replaces the browser cache. Acknowledging an older write cannot remove a newer pending edit.
- Startup failures and invalid server data preserve cached drafts. Retry saving and backup download remain available.
- Browser-only development still works without journaling server writes.
- Batched cache writes roll back on storage quota failure; SQLite batches reject invalid entries without partial changes.
- Serialized snapshots survive concurrent requests and shutdown. Failed snapshot creation can be retried. Retention keeps seven dated files and preserves unrelated files.
- A snapshot restored into a fresh directory opens as an independent database with the expected progress.
- Missing assets return JSON 404 errors; app routes return uncached HTML. Missing builds and occupied ports fail cleanly.
- The portable bundle starts from another working directory and a path containing spaces, using its included runtime. Its 112 assets respond locally. Saved data survives shutdown and restart, and a restart creates a snapshot.
- Worker and iframe lifecycle tests cover stop, timeout, cleanup, and stale results.
- Worker reply validation and message-decoding failures have Node coverage: unreadable feedback reports a retryable error, releases resources, and cannot publish check evidence. This failure injection does not establish a real-browser message-decoding failure.

Run `yarn lint`, `yarn test`, and `yarn package`, then `node scripts/verify-portable.mjs`. The portable check uses temporary app/data folders and removes them afterward. On Windows it invokes the bundled runtime directly; the `.cmd` launcher still needs a manual pass.

Portable CI now runs content validation, packages before the Node suite so server tests have current assets, and executes the smoke script on Linux, macOS, and Windows. The Windows runtime accepts a shutdown message only over a parent-created Node IPC channel; no HTTP shutdown endpoint is exposed. Requests accepted during shutdown retain the original loopback host check while the server drains them. Configuring these jobs does not establish a remote CI pass or manual launcher validation.

Static-asset containment uses the platform's path separator, preserving the existing directory boundary on Windows as well as POSIX systems.

## Still pending

- Windows and Linux execution, including their launchers, filesystem behavior, upgrades, and restore.
- OS-level networking disconnection across the app. The browser suite blocks external HTTP requests during selected cold local-server editor, worker, and preview flows while keeping loopback available.
- Manual learner verification of save-recovery wording and import behavior. Real-browser automated cases now exercise save failure, cached backup export, reload replay, retry, old acknowledgements, clean-context server restart, invalid import preservation, and valid backup restore into a separate profile.
- Migration from every previously released bundle version and assistive-technology checks.

The earlier frontend exercise browser pass verified its checks and local persistence; it does not establish these new recovery flows. Learner validation remains deferred until the internal quality pass is ready.

## Local fluency platform follow-up

Profile migration, profile-separated learning state, validated full-profile restore inputs, recurring-review scheduling, knowledge references, module imports, and React profile/notebook/assessment/round/project flows are covered by automated tests. The React flow test substitutes Monaco; it does not establish editor fidelity or accessibility. The updated macOS arm64 portable bundle smoke passed with 111 local assets, a path containing spaces, the bundled runtime, persistence across restart, snapshot creation, and clean shutdown. Temporary data directories were used.

Native Zen automation reached the isolated local app, but its screenshot/accessibility output remained stale or limited. A full visual or assistive-technology walkthrough cannot be claimed from that attempt. Windows/Linux local execution and OS-level disconnected-browser checks remain pending.

## Current browser and portable follow-up

On macOS, 21 Chromium flows passed, including the isolated SQLite recovery and backup cases described in `docs/BROWSER_TESTING.md`. The latest arm64 portable bundle smoke passed with 24 local assets, bundled-runtime startup from a path containing spaces, save, restart, snapshot, and clean shutdown. Data directories were temporary. This updates the earlier asset-count snapshots above; it does not establish Windows/Linux execution or the Windows `.cmd` launcher.
