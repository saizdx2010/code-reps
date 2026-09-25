# Run Code Reps on your laptop

Code Reps is free and does not need an account or internet connection after dependencies have been installed.

## First run

1. Install Node.js 24 or later and Yarn 1.
2. In this project folder, run `yarn install`, then `yarn build`.
3. Run `yarn serve` and open `http://127.0.0.1:4173`.

The server listens only on your own laptop. It saves progress in `~/.code-reps/progress.sqlite`. The browser also keeps a local copy for quick startup and for the development server.

## Bring over older progress

If you used the earlier preview on `http://127.0.0.1:4173`, the first launch migrates its browser data automatically when the SQLite database is empty. If you used another address or port, open the old app, choose **Progress → Download backup**, then use **Import backup** in the local app.

Keep the downloaded JSON file until you have checked that your attempts appear in History and Progress.

## Update

Stop the server, update the project files, then run `yarn install`, `yarn build`, and `yarn serve`. The database lives outside the project folder and remains in place. Export a JSON backup before a major update.

## Restore

Use **Progress → Import backup** with a Code Reps JSON backup. It adds completed attempts and fills empty drafts without replacing existing drafts. Daily SQLite snapshots are also kept in `~/.code-reps/backups` for seven days; stop the server before replacing a damaged database with one of those files.

If you need a different data location or port, set `CODE_REPS_DATA_DIR` or `CODE_REPS_PORT` when starting the server. Keep the port stable: browsers separate local data by address and port.
