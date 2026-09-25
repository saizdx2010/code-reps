import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
    assert.equal((await request('/api/entry', 'PUT', { key: 'code-reps:selected-rep', value: 'sum-positive-numbers' })).status, 200)
    await new Promise((resolve) => running.server.close(resolve))
    running = await startServer({ port: 0, dataDir })
    assert.equal((await (await fetch(`${running.url}/api/state`)).json()).entries['code-reps:selected-rep'], 'sum-positive-numbers')
    assert.equal((await readdir(join(dataDir, 'backups'))).length, 1)
  } finally {
    if (running?.server.listening) await new Promise((resolve) => running.server.close(resolve))
    await rm(dataDir, { recursive: true, force: true })
  }
})
