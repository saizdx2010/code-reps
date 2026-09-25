# Code Reps portable test bundle

This folder contains Code Reps and a Node.js runtime. It runs locally without an account or internet connection.

- macOS or Linux: run `./start-code-reps.sh` from a terminal.
- Windows: run `Start Code Reps.cmd`.
- Open `http://127.0.0.1:4173` in your browser. Keep the launcher running while you practise.

Progress is saved in `~/.code-reps/progress.sqlite` on macOS and Linux, or in the corresponding home directory on Windows. Use **Progress → Download backup** before moving to another computer. Daily SQLite backups are kept in the `backups` folder beside the database.

These test bundles are not signed public installers. The 1.0 release gate includes platform signing, first-run testing, and upgrade testing.
