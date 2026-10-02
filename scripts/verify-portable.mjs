import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, cp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const root = await mkdtemp(join(tmpdir(), 'Code Reps portable '))
const bundle = join(root, 'app with spaces')
const data = join(root, 'progress')
let child
async function launch() {
  child = spawn(process.platform === 'win32' ? join(bundle, 'node.exe') : join(bundle, 'start-code-reps.sh'), process.platform === 'win32' ? [join(bundle, 'server/index.mjs')] : [], { cwd: tmpdir(), stdio: ['ignore', 'pipe', 'pipe', ...(process.platform === 'win32' ? ['ipc'] : [])], env: { ...process.env, CODE_REPS_DATA_DIR: data, CODE_REPS_PORT: '0', PATH: '/usr/bin:/bin' } })
  let output = ''
  child.stderr.on('data', chunk => { output += chunk })
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Launcher timeout: '+output)), 10000)
    child.stdout.on('data', chunk => { output += chunk; const match = output.match(/running at (http:\/\/127\.0\.0\.1:\d+)/); if (match) { clearTimeout(timeout); resolve(match[1]) } })
    child.once('error', error => { clearTimeout(timeout); reject(error) })
    child.once('exit', code => { clearTimeout(timeout); if (!output.includes('running at')) reject(new Error('Launcher exited '+code+': '+output)) })
  })
}
async function stop() {
  const exiting = new Promise(resolve => child.once('exit', resolve))
  const timeout = setTimeout(() => child.kill('SIGKILL'), 10000)
  try {
    if (process.platform === 'win32') child.send('shutdown')
    else child.kill('SIGTERM')
    assert.equal(await exiting, 0)
  } finally { clearTimeout(timeout) }
}
try {
  await cp(join(process.cwd(), `release/code-reps-${process.platform}-${process.arch}`), bundle, { recursive: true })
  let url = await launch()
  const html = await (await fetch(url)).text()
  assert.ok(html.includes('Loading your local progress'))
  const assets = await readdir(join(bundle, 'dist/assets'))
  for (const asset of assets) assert.equal((await fetch(`${url}/assets/${asset}`, { method: 'HEAD' })).status, 200, asset)
  assert.equal((await fetch(`${url}/api/entries`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries: { 'code-reps:draft:portable': 'portable saved' } }) })).status, 200)
  await stop()
  url = await launch()
  assert.equal((await (await fetch(`${url}/api/state`)).json()).entries['code-reps:draft:portable'], 'portable saved')
  await stop()
  assert.equal((await readdir(join(data, 'backups'))).length, 1)
  console.log(`Portable ${process.platform} ${process.arch} smoke passed: ${assets.length} local assets, first run, path spaces, bundled runtime, save, restart, snapshot, clean shutdown.`)
} finally {
  if (child?.exitCode === null && child.signalCode === null) {
    const exiting = once(child, 'exit')
    child.kill('SIGKILL')
    await exiting
  }
  await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
}
