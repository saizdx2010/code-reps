import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request as httpRequest } from 'node:http'
import { startServer } from '../server/index.mjs'
import { writeAppAssets } from './helpers/app-assets.mjs'
import { createLocalStore } from '../src/local-store.ts'

test('local server migrates once, persists data, and backs up on restart', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code-reps-test-'))
  const dataDir = join(root, 'data')
  const assetsDir = await writeAppAssets(join(root, 'app'))
  let running
  try {
    running = await startServer({ port: 0, dataDir, assetsDir })
    const origin = running.url
    const request = (path, method = 'GET', body) =>
      fetch(`${origin}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Origin: origin },
        body: body && JSON.stringify(body),
      })
    const legacy = { 'code-reps:history:v1': '[{"id":"first"}]' }
    assert.equal((await request('/api/migrate', 'POST', { entries: legacy })).status, 200)
    assert.equal((await (await request('/api/migrate', 'POST', { entries: { 'code-reps:history:v1': '[]' } })).json()).migrated, false)
    assert.deepEqual((await (await request('/api/state')).json()).entries, legacy)
    assert.equal((await fetch(`${origin}/api/state`, { headers: { Origin: 'http://other-site.test' } })).status, 403)
    const badHostStatus = await new Promise((resolve, reject) => {
      const req = httpRequest(`${origin}/api/state`, { headers: { Host: 'other-site.test' } }, res => {
        res.resume()
        resolve(res.statusCode)
      })
      req.on('error', reject)
      req.end()
    })
    assert.equal(badHostStatus, 403)
    assert.equal(
      (
        await request('/api/entries', 'PATCH', {
          entries: { 'code-reps:selected-rep': 'sum-positive-numbers', 'code-reps:draft:one': 'draft' },
        })
      ).status,
      200,
    )
    assert.equal((await request('/api/entries', 'PATCH', { entries: { 'code-reps:draft:one': null } })).status, 200)
    assert.equal((await request('/api/entries', 'PATCH', { entries: { 'Code-Reps:Bad': 'value' } })).status, 400)
    // The single-entry endpoints were retired; the client saves only through PATCH /api/entries.
    assert.equal((await request('/api/entry', 'PUT', { key: 'code-reps:selected-rep', value: 'other' })).status, 404)
    assert.equal((await request('/api/entry', 'DELETE', { key: 'code-reps:selected-rep' })).status, 404)
    await running.close()
    running = await startServer({ port: 0, dataDir, assetsDir })
    const restarted = (await (await fetch(`${running.url}/api/state`)).json()).entries
    assert.equal(restarted['code-reps:selected-rep'], 'sum-positive-numbers')
    assert.equal(restarted['code-reps:draft:one'], undefined)
    assert.equal((await readdir(join(dataDir, 'backups'))).length, 1)
  } finally {
    await running?.close()
    await rm(root, { recursive: true, force: true })
  }
})

test('CLI closes through its parent IPC channel without exposing a shutdown endpoint', async () => {
  const { spawn } = await import('node:child_process')
  const { once } = await import('node:events')
  const root = await mkdtemp(join(tmpdir(), 'code-reps-ipc-'))
  const dataDir = join(root, 'data')
  // Mirror the portable layout (server/ beside dist/) so the CLI finds fixture assets, not the real build.
  await cp(new URL('../server/', import.meta.url), join(root, 'server'), { recursive: true })
  await writeAppAssets(join(root, 'dist'))
  const child = spawn(process.execPath, [join(root, 'server', 'index.mjs')], {
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, CODE_REPS_DATA_DIR: dataDir, CODE_REPS_PORT: '0' },
  })
  const timeout = setTimeout(() => child.kill('SIGKILL'), 10000)
  try {
    let output = ''
    let errors = ''
    child.stderr.on('data', chunk => {
      errors += chunk
    })
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
    await rm(root, { recursive: true, force: true })
  }
})

// Starts a server on a temporary data folder and passes `run` a same-origin fetch for it.
async function withServer(run) {
  const root = await mkdtemp(join(tmpdir(), 'code-reps-test-'))
  const running = await startServer({ port: 0, dataDir: join(root, 'data'), assetsDir: await writeAppAssets(join(root, 'app')) })
  try {
    const request = (path, options = {}) =>
      fetch(`${running.url}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', Origin: running.url, ...options.headers },
      })
    await run({ running, request })
  } finally {
    await running.close()
    await rm(root, { recursive: true, force: true })
  }
}

test('a save split across network chunks keeps characters that straddle the split', async () => {
  await withServer(async ({ running }) => {
    const body = Buffer.from(JSON.stringify({ entries: { 'code-reps:note': 'naïve café — 日本語 🎯' } }))
    // Split inside the first multi-byte character so each chunk alone would decode to a replacement character.
    const split = body.indexOf(Buffer.from('ï')) + 1
    const status = await new Promise((resolve, reject) => {
      const { port } = new URL(running.url)
      const req = httpRequest(
        {
          host: '127.0.0.1',
          port,
          path: '/api/entries',
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
        },
        res => {
          res.resume()
          resolve(res.statusCode)
        },
      )
      req.on('error', reject)
      req.write(body.subarray(0, split))
      setTimeout(() => req.end(body.subarray(split)), 20)
    })
    assert.equal(status, 200)
    assert.equal(running.store.entries()['code-reps:note'], 'naïve café — 日本語 🎯')
  })
})

test('bodies that are not an entries object, or too large, get a 400 with a reason', async () => {
  await withServer(async ({ running, request }) => {
    for (const body of ['null', '[]', '7', '"text"']) {
      for (const [path, method] of [
        ['/api/entries', 'PATCH'],
        ['/api/migrate', 'POST'],
      ]) {
        const response = await request(path, { method, body })
        assert.equal(response.status, 400, `${method} ${body}`)
        assert.match((await response.json()).error, /Invalid/)
      }
    }
    const huge = await request('/api/entries', {
      method: 'PATCH',
      body: JSON.stringify({ entries: { 'code-reps:x': 'x'.repeat(70 * 1024 * 1024) } }),
    })
    assert.equal(huge.status, 400)
    assert.equal((await huge.json()).error, 'Request is too large.')
    // The connection still serves the next request after a refused body.
    assert.equal((await request('/api/state')).status, 200)
    assert.deepEqual(running.store.entries(), {})
  })
})

test('the browser store copies a large browser history to a new server and saves big imports', async () => {
  await withServer(async ({ running, request }) => {
    const map = new Map([
      ...Array.from({ length: 1200 }, (_, index) => [`code-reps:profile:default:attempt:rep-${index}:v1`, `draft ${index} ✓`]),
      ['code-reps:profile:default:history:v1', 'ü'.repeat(3_000_000)],
    ])
    const local = Object.fromEntries(map)
    const storage = {
      get length() {
        return map.size
      },
      key: index => [...map.keys()][index] ?? null,
      getItem: key => map.get(key) ?? null,
      setItem: (key, value) => map.set(key, value),
      removeItem: key => map.delete(key),
    }
    const store = createLocalStore({ storage, request, onError() {} })
    await store.initializeStorage()
    assert.equal(store.storageIssue(), '')
    assert.deepEqual(running.store.entries(), local)
    const imported = Object.fromEntries(
      Array.from({ length: 700 }, (_, index) => [`code-reps:profile:second:attempt:rep-${index}:v1`, 'x'.repeat(10_000)]),
    )
    store.localStore.setEntries(imported)
    await store.flushStorage()
    assert.deepEqual(running.store.entries(), { ...local, ...imported })
  })
})
