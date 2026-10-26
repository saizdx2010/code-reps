// macOS only: run the local SQLite service at login, so the app (or its installed web app) opens without a terminal and
// the daily snapshots keep being taken. `yarn autostart` installs it, `yarn autostart --remove` removes it.
// It serves this checkout's `dist`, so rebuild after updating; `yarn autostart` again restarts the service.
import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, userInfo } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { needsBuild } from './start.mjs'

export const label = 'dev.code-reps.server'
const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The LaunchAgent property list. The data folder and port are written out, so the service keeps using the same ones. */
export function launchAgentPlist({ node, serverPath, workingDirectory, dataDir, port }) {
  const string = value => `<string>${escapeXml(String(value))}</string>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>${string(label)}
  <key>ProgramArguments</key>
  <array>${string(node)}${string(serverPath)}</array>
  <key>WorkingDirectory</key>${string(workingDirectory)}
  <key>EnvironmentVariables</key>
  <dict>
    <key>CODE_REPS_DATA_DIR</key>${string(dataDir)}
    <key>CODE_REPS_PORT</key>${string(port)}
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key>
  <dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key>${string(join(dataDir, 'server.log'))}
  <key>StandardErrorPath</key>${string(join(dataDir, 'server.log'))}
</dict>
</plist>
`
}

const plistPath = join(homedir(), 'Library', 'LaunchAgents', `${label}.plist`)
const domain = `gui/${userInfo().uid}`
const launchctl = (...args) => spawnSync('launchctl', args, { encoding: 'utf8' })

function install() {
  const dataDir = process.env.CODE_REPS_DATA_DIR || join(homedir(), '.code-reps')
  const port = Number(process.env.CODE_REPS_PORT || 4173)
  if (needsBuild(root)) {
    process.stdout.write('The build is missing or older than the source. Building first…\n')
    if (spawnSync('yarn', ['build'], { cwd: root, stdio: 'inherit' }).status !== 0)
      throw new Error('The build failed, so nothing was installed.')
  }
  mkdirSync(dataDir, { recursive: true })
  mkdirSync(join(homedir(), 'Library', 'LaunchAgents'), { recursive: true })
  const plist = launchAgentPlist({
    node: process.execPath,
    serverPath: join(root, 'server', 'index.mjs'),
    workingDirectory: root,
    dataDir,
    port,
  })
  // Replace any earlier copy, so a moved checkout, a new Node, or a rebuilt server takes effect.
  launchctl('bootout', `${domain}/${label}`)
  writeFileSync(plistPath, plist)
  const loaded = launchctl('bootstrap', domain, plistPath)
  if (loaded.status !== 0) throw new Error(`launchctl could not load ${plistPath}: ${loaded.stderr.trim()}`)
  process.stdout.write(
    `Code Reps now starts at login on http://127.0.0.1:${port}\nData: ${dataDir}\nLog: ${join(dataDir, 'server.log')}\nRemove it with: yarn autostart --remove\n`,
  )
}

function remove() {
  launchctl('bootout', `${domain}/${label}`)
  rmSync(plistPath, { force: true })
  process.stdout.write('Code Reps no longer starts at login. Your progress is unchanged.\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.platform !== 'darwin') throw new Error('Starting at login is set up for macOS only. Use `yarn start` instead.')
    if (process.argv.includes('--remove')) remove()
    else install()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`)
    process.exitCode = 1
  }
}
