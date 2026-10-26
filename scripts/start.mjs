// One command to practice: `yarn start` (or `just start`).
// Opens the running local app if there is one. Otherwise it rebuilds when the build is missing or older than the source,
// starts the SQLite service in the background with its output in the data folder's server.log, and opens the browser.
// The service keeps running after this command exits, so the daily snapshots keep being taken; stop it with `yarn stop`.
import { spawn, spawnSync } from 'node:child_process'
import { closeSync, mkdirSync, openSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
/** What the build is made from. A newer file in any of these means `dist` is stale. */
const buildInputs = ['src', 'public', 'index.html', 'package.json', 'yarn.lock', 'vite.config.ts', 'tsconfig.app.json']

/** The newest modification time under `path`, or 0 when it does not exist. */
function newestTime(path) {
  let info
  try {
    info = statSync(path)
  } catch {
    return 0
  }
  if (!info.isDirectory()) return info.mtimeMs
  let newest = info.mtimeMs
  for (const entry of readdirSync(path)) newest = Math.max(newest, newestTime(join(path, entry)))
  return newest
}

/** True when `dist/index.html` is missing or any build input changed after it was written. */
export function needsBuild(dir = root) {
  const built = newestTime(join(dir, 'dist', 'index.html'))
  return !built || buildInputs.some(input => newestTime(join(dir, input)) > built)
}

/** True when a Code Reps server answers at `url`: its manifest names the app. Anything else on the port counts as no. */
export async function isRunning(url) {
  try {
    const response = await fetch(new URL('/manifest.webmanifest', url), { signal: AbortSignal.timeout(1500) })
    return response.ok && (await response.json()).name === 'Code Reps'
  } catch {
    return false
  }
}

async function waitUntilRunning(url, timeoutMs = 15_000) {
  const end = Date.now() + timeoutMs
  while (Date.now() < end) {
    if (await isRunning(url)) return true
    await new Promise(done => setTimeout(done, 250))
  }
  return false
}

export function openCommand(platform = process.platform) {
  if (platform === 'darwin') return ['open']
  if (platform === 'win32') return ['cmd', '/c', 'start', '""']
  return ['xdg-open']
}

function openBrowser(url) {
  const [command, ...args] = openCommand()
  spawn(command, [...args, url], { stdio: 'ignore', detached: true }).unref()
}

const port = Number(process.env.CODE_REPS_PORT || 4173)
const url = `http://127.0.0.1:${port}`
const dataDir = process.env.CODE_REPS_DATA_DIR || join(homedir(), '.code-reps')
const pidFile = join(dataDir, 'server.pid')

async function start() {
  if (await isRunning(url)) {
    process.stdout.write(`Code Reps is already running at ${url}\n`)
    if (!process.argv.includes('--no-open')) openBrowser(url)
    return
  }
  if (needsBuild()) {
    process.stdout.write('The build is missing or older than the source. Building first…\n')
    const build = spawnSync('yarn', ['build'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
    if (build.status !== 0) throw new Error('The build failed, so the app was not started. Your saved progress is unchanged.')
  }
  mkdirSync(dataDir, { recursive: true })
  const log = openSync(join(dataDir, 'server.log'), 'a')
  const server = spawn(process.execPath, [join(root, 'server', 'index.mjs')], {
    cwd: root,
    detached: true,
    stdio: ['ignore', log, log],
    env: process.env,
    windowsHide: true,
  })
  server.unref()
  closeSync(log)
  if (!(await waitUntilRunning(url))) {
    throw new Error(`The server did not start. See ${join(dataDir, 'server.log')} (is port ${port} used by something else?).`)
  }
  writeFileSync(pidFile, String(server.pid))
  process.stdout.write(`Code Reps is running at ${url}\nData: ${dataDir}\nStop it with: yarn stop\n`)
  if (!process.argv.includes('--no-open')) openBrowser(url)
}

/** Stops the server this script started. A server started some other way (a terminal, the login item) is left alone,
 * and so is a recorded process ID once nothing answers on the port, since the system may have reused it. */
async function stop() {
  let pid
  try {
    pid = Number(readFileSync(pidFile, 'utf8'))
  } catch {
    process.stdout.write('No server started by `yarn start` is recorded.\n')
    return
  }
  rmSync(pidFile, { force: true })
  if (!pid || !(await isRunning(url))) {
    process.stdout.write('That server had already stopped.\n')
    return
  }
  try {
    process.kill(pid, 'SIGTERM')
    process.stdout.write(`Stopped Code Reps (process ${pid}).\n`)
  } catch {
    process.stdout.write('That server had already stopped.\n')
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--stop')) await stop()
    else await start()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 1
  }
}
