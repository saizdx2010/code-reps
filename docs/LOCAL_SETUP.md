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

Use **Progress → Import backup** with a Code Reps JSON backup. It adds completed attempts and fills empty drafts without replacing existing drafts. Attempts may carry optional self-reported mistake tags; unknown tag IDs in an imported file are dropped and the rest of the attempt is kept. Daily SQLite snapshots are also kept in `~/.code-reps/backups`. The seven latest dated snapshots are retained. A snapshot is created on restart when a database already exists, then once every 24 hours while the server runs. The first snapshot for each UTC date is kept.

To restore a SQLite snapshot:

1. Stop the server and close app tabs.
2. Move `progress.sqlite` and any `progress.sqlite-wal` and `progress.sqlite-shm` files into a separate recovery folder. Keep them until recovery is confirmed.
3. Copy your chosen dated snapshot into the data directory and name the copy `progress.sqlite`. Keep the original snapshot.
4. Restart the server and check History and Progress. Pending browser saves may be replayed onto the restored database to recover recent work.

If you need a different data location or port, set `CODE_REPS_DATA_DIR` or `CODE_REPS_PORT` when starting the server. Keep the port stable: browsers separate local data by address and port.

## When saving fails

The app keeps pending server writes in the browser and retries them before loading server progress on the next startup. Keep the same browser and address, restart the local server, then choose **Retry saving**. Use **Download backup** while the browser copy is still available. Clearing browser data can remove pending work.

Backup imports are committed to SQLite as one batch. Invalid batches leave stored progress unchanged. An import that cannot reach the server stays pending in the browser until saving succeeds.

See [local reliability verification](LOCAL_RELIABILITY.md) for tested behavior and remaining platform checks.
