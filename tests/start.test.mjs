import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { launchAgentPlist } from '../scripts/autostart.mjs'
import { isRunning, needsBuild, openCommand } from '../scripts/start.mjs'
import { startServer } from '../server/index.mjs'

const temp = t => {
  const dir = mkdtempSync(join(tmpdir(), 'code-reps-start-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}
const write = (path, text = '') => {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, text)
}
const age = (path, secondsAgo) => {
  const time = new Date(Date.now() - secondsAgo * 1000)
  utimesSync(path, time, time)
}

test('needsBuild: builds when dist is missing, skips a fresh build, and rebuilds after a source edit', t => {
  const dir = temp(t)
  write(join(dir, 'src', 'main.tsx'))
  age(join(dir, 'src', 'main.tsx'), 60)
  age(join(dir, 'src'), 60)
  assert.equal(needsBuild(dir), true)

  write(join(dir, 'dist', 'index.html'))
  assert.equal(needsBuild(dir), false)

  write(join(dir, 'src', 'deep', 'rep.ts'))
  utimesSync(join(dir, 'dist', 'index.html'), new Date(Date.now() - 30_000), new Date(Date.now() - 30_000))
  assert.equal(needsBuild(dir), true)
})

test('isRunning recognizes a Code Reps server and nothing else', async t => {
  const dir = temp(t)
  write(join(dir, 'dist', 'index.html'), '<!doctype html>')
  write(join(dir, 'dist', 'manifest.webmanifest'), JSON.stringify({ name: 'Code Reps' }))
  const app = await startServer({ port: 0, dataDir: join(dir, 'data'), assetsDir: join(dir, 'dist') })
  t.after(() => app.close())
  assert.equal(await isRunning(app.url), true)

  write(join(dir, 'other', 'index.html'), '<!doctype html>')
  write(join(dir, 'other', 'manifest.webmanifest'), JSON.stringify({ name: 'Something else' }))
  const other = await startServer({ port: 0, dataDir: join(dir, 'other-data'), assetsDir: join(dir, 'other') })
  t.after(() => other.close())
  assert.equal(await isRunning(other.url), false)

  const closed = await startServer({ port: 0, dataDir: join(dir, 'closed-data'), assetsDir: join(dir, 'dist') })
  const closedUrl = closed.url
  await closed.close()
  assert.equal(await isRunning(closedUrl), false)
})

test('the login item runs this checkout with a fixed data folder and port, and escapes paths', () => {
  const plist = launchAgentPlist({
    node: '/opt/node/bin/node',
    serverPath: '/Users/me/R&D <code>/server/index.mjs',
    workingDirectory: '/Users/me/R&D <code>',
    dataDir: '/Users/me/.code-reps',
    port: 4173,
  })
  assert.match(plist, /<key>Label<\/key><string>dev\.code-reps\.server<\/string>/)
  assert.match(plist, /<string>\/opt\/node\/bin\/node<\/string><string>\/Users\/me\/R&amp;D &lt;code&gt;\/server\/index\.mjs<\/string>/)
  assert.match(plist, /<key>CODE_REPS_DATA_DIR<\/key><string>\/Users\/me\/\.code-reps<\/string>/)
  assert.match(plist, /<key>CODE_REPS_PORT<\/key><string>4173<\/string>/)
  assert.match(plist, /<key>StandardErrorPath<\/key><string>\/Users\/me\/\.code-reps\/server\.log<\/string>/)
  assert.doesNotMatch(plist, /R&D/)
})

test('the browser opens with the platform command', () => {
  assert.deepEqual(openCommand('darwin'), ['open'])
  assert.deepEqual(openCommand('linux'), ['xdg-open'])
  assert.deepEqual(openCommand('win32'), ['cmd', '/c', 'start', '""'])
})
