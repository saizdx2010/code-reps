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

Run `yarn lint`, `yarn test`, and `yarn package`, then `node scripts/verify-portable.mjs`. The portable check uses temporary app/data folders and removes them afterward. On Windows it invokes the bundled runtime directly; the `.cmd` launcher still needs a manual pass.

## Still pending

- Windows and Linux execution, including their launchers, filesystem behavior, upgrades, and restore.
- A browser session with external networking disconnected, including editor loading and frontend preview. Serving every asset locally establishes availability but does not replace that browser check.
- Manual verification of the new save-recovery banner, retry action, and import failures in the browser.
- Migration from every previously released bundle version and assistive-technology checks.

The earlier frontend exercise browser pass verified its checks and local persistence; it does not establish these new recovery flows. Learner validation remains deferred until the internal quality pass is ready.
