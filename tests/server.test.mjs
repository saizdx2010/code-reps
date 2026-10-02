import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request as httpRequest } from 'node:http'
import { startServer } from '../server/index.mjs'

test('local server migrates once, persists data, and backs up on restart', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'code-reps-test-'))
  let running
  try {
    running = await startServer({ port: 0, dataDir })
    const origin = running.url
    const request = (path, method = 'GET', body) => fetch(`${origin}${path}`, {
      method, headers: { 'Content-Type': 'application/json', Origin: origin },
      body: body && JSON.stringify(body),
    })
    const legacy = { 'code-reps:history:v1': '[{"id":"first"}]' }
    assert.equal((await request('/api/migrate', 'POST', { entries: legacy })).status, 200)
    assert.equal((await (await request('/api/migrate', 'POST', { entries: { 'code-reps:history:v1': '[]' } })).json()).migrated, false)
    assert.deepEqual((await (await request('/api/state')).json()).entries, legacy)
    assert.equal((await fetch(`${origin}/api/state`, { headers: { Origin: 'http://other-site.test' } })).status, 403)
    const badHostStatus = await new Promise((resolve, reject) => {
      const req = httpRequest(`${origin}/api/state`, { headers: { Host: 'other-site.test' } }, (res) => { res.resume(); resolve(res.statusCode) })
      req.on('error', reject)
      req.end()
    })
    assert.equal(badHostStatus, 403)
    assert.equal((await request('/api/entry', 'PUT', { key: 'code-reps:selected-rep', value: 'sum-positive-numbers' })).status, 200)
    await running.close()
    running = await startServer({ port: 0, dataDir })
    assert.equal((await (await fetch(`${running.url}/api/state`)).json()).entries['code-reps:selected-rep'], 'sum-positive-numbers')
    assert.equal((await readdir(join(dataDir, 'backups'))).length, 1)
  } finally {
    await running?.close()
    await rm(dataDir, { recursive: true, force: true })
  }
})

test('CLI closes through its parent IPC channel without exposing a shutdown endpoint', async () => {
  const { spawn } = await import('node:child_process')
  const { once } = await import('node:events')
  const dataDir = await mkdtemp(join(tmpdir(), 'code-reps-ipc-'))
  const child = spawn(process.execPath, ['server/index.mjs'], {
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, CODE_REPS_DATA_DIR: dataDir, CODE_REPS_PORT: '0' },
  })
  const timeout = setTimeout(() => child.kill('SIGKILL'), 10000)
  try {
    let output = ''
    let errors = ''
    child.stderr.on('data', chunk => { errors += chunk })
    const exited = once(child, 'exit')
    const ready = new Promise((resolve, reject) => {
      child.stdout.on('data', chunk => {
        output += chunk
        const url = output.match(/running at (http:\/\/127\.0\.0\.1:\d+)/)?.[1]
        if (url) resolve(url)
      })
      child.once('error', reject)
      child.once('exit', () => reject(new Error(`Server exited before startup: ${errors}`)))
    })
    const url = await ready
    assert.equal((await fetch(`${url}/api/shutdown`, { method: 'POST' })).status, 404)
    child.send('shutdown')
    assert.deepEqual(await exited, [0, null])
  } finally {
    clearTimeout(timeout)
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await rm(dataDir, { recursive: true, force: true })
  }
})
