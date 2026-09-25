# Code Reps portable local web bundle

This folder contains Code Reps and a Node.js runtime. It runs locally without an account or internet connection.

- macOS or Linux: run `./start-code-reps.sh` from a terminal.
- Windows: run `Start Code Reps.cmd`.
- Open `http://127.0.0.1:4173` in your browser. Keep the launcher running while you practise.

Progress is saved in `~/.code-reps/progress.sqlite` on macOS and Linux, or in the corresponding home directory on Windows. Use **Progress → Download backup** before moving to another computer. Daily SQLite backups are kept in the `backups` folder beside the database.

This is a local web app served by the included runtime. It does not install a desktop application. Public release still needs first-run, upgrade, restore, and offline testing on each platform.
