# Local reliability: still pending

Automated coverage of the local service is described elsewhere: [browser testing](./BROWSER_TESTING.md) lists the real-browser SQLite failure, replay, restore, and disconnected-asset flows, and [Maintaining](./MAINTAINING.md#backups-and-data) covers the portable smoke test (`node scripts/verify-portable.mjs`) and where data lives. Local passes so far were on macOS arm64. The portable workflow (`.github/workflows/portable-bundles.yml`) runs content validation, packaging, the Node suite, and the smoke test on Linux, macOS, and Windows; configuring it does not establish a remote pass or manual launcher validation.

## Still pending

- Windows and Linux execution, including their launchers (the Windows `.cmd` launcher still needs a manual pass), filesystem behavior, upgrades, and restore.
- OS-level network disconnection across the whole app. The browser suite blocks external HTTP requests only during selected cold local-server flows, with loopback still available.
- Manual learner verification of save-recovery wording and import behavior.
- Migration from every previously released bundle version.
- A full visual and assistive-technology walkthrough; see the [accessibility review](./ACCESSIBILITY_REVIEW.md). An earlier native-automation attempt could not capture reliable screenshots or accessibility output.

## Behavior to preserve

- The Windows runtime accepts a shutdown message only over a parent-created Node IPC channel; there is no HTTP shutdown endpoint. Requests accepted during shutdown keep the loopback host check while the server drains them.
- Static-asset containment uses the platform's path separator, so the directory boundary holds on Windows as well as POSIX systems.
