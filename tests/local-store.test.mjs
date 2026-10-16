import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalStore, keyAllowed, migrationKey, requestBatches } from '../src/local-store.ts'
import { maxEntriesPerRequest, maxRequestBytes, requestBatchBytes, storageKeyAllowed } from '../server/storage-keys.mjs'

const draftKey = 'code-reps:attempt:sum-positive-numbers:v1'
const journalKey = 'code-reps:pending-writes:v1'
function storage(entries = {}) {
  const map = new Map(Object.entries(entries))
  return {
    get length() {
      return map.size
    },
    key: index => [...map.keys()][index] ?? null,
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  }
}
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
function server(initial = {}) {
  const entries = { ...initial },
    calls = []
  let available = true
  const request = async (url, options) => {
    calls.push({ url, options })
    if (!available) throw new TypeError('offline')
    if (url === '/api/state') return response({ entries: { ...entries } })
    // The same limits the real server enforces, so an unsplit request fails here as it would there.
    if (Buffer.byteLength(options.body) > maxRequestBytes) return response({ error: 'Request is too large.' }, 400)
    const body = JSON.parse(options.body)
    if (Object.keys(body.entries).length > maxEntriesPerRequest) return response({ error: 'Invalid saved entries.' }, 400)
    if (url === '/api/migrate') {
      if (Object.keys(entries).length) return response({ migrated: false, entries })
      Object.assign(entries, body.entries)
      return response({ migrated: true, entries })
    }
    assert.equal(url, '/api/entries')
    assert.equal(options.method, 'PATCH')
    for (const [key, value] of Object.entries(body.entries)) {
      if (value === null) delete entries[key]
      else entries[key] = value
    }
    return response({ saved: true })
  }
  return {
    entries,
    calls,
    request,
    offline: () => {
      available = false
    },
    online: () => {
      available = true
    },
  }
}

test('first run migrates legacy browser data without migrating internal metadata', async () => {
  const cached = storage({ [draftKey]: 'old draft' })
  const remote = server()
  const store = createLocalStore({ storage: cached, request: remote.request, onError() {} })
  await store.initializeStorage()
  assert.equal(store.isServerReady(), true)
  assert.equal(remote.entries[draftKey], 'old draft')
  assert.equal(remote.entries['code-reps:server-mode:v1'], undefined)
})

test('failed saves survive a restart and replay before the browser cache is replaced', async () => {
  const cached = storage()
  const remote = server({ [draftKey]: 'old server draft' })
  const first = createLocalStore({ storage: cached, request: remote.request, onError() {} })
  await first.initializeStorage()
  remote.offline()
  first.localStore.setItem(draftKey, 'new unfinished code')
  await assert.rejects(first.flushStorage())
  assert.equal(cached.getItem(draftKey), 'new unfinished code')
  assert.equal(JSON.parse(cached.getItem(journalKey))[draftKey], 'new unfinished code')
  remote.online()
  const restarted = createLocalStore({ storage: cached, request: remote.request, onError() {} })
  await restarted.initializeStorage()
  assert.equal(remote.entries[draftKey], 'new unfinished code')
  assert.equal(restarted.localStore.getItem(draftKey), 'new unfinished code')
  assert.equal(cached.getItem(journalKey), null)
})

test('retry saving recovers a pending batch including removals', async () => {
  const cached = storage()
  const remote = server({ [draftKey]: 'old', 'code-reps:selected-rep': 'old-id' })
  const store = createLocalStore({ storage: cached, request: remote.request, onError() {} })
  await store.initializeStorage()
  remote.offline()
  store.localStore.setEntries({ [draftKey]: 'imported draft', 'code-reps:selected-rep': null })
  await assert.rejects(store.flushStorage())
  remote.online()
  await store.retryStorage()
  assert.equal(remote.entries[draftKey], 'imported draft')
  assert.equal(remote.entries['code-reps:selected-rep'], undefined)
  assert.equal(store.storageIssue(), '')
})

test('an older acknowledgement cannot discard a newer pending value', async () => {
  const cached = storage()
  const remote = server({ [draftKey]: 'old' })
  let release
  let firstPatch = true
  const store = createLocalStore({
    storage: cached,
    onError() {},
    request: async (url, options) => {
      if (url === '/api/entries' && firstPatch) {
        firstPatch = false
        await new Promise(resolve => {
          release = resolve
        })
      }
      return remote.request(url, options)
    },
  })
  await store.initializeStorage()
  store.localStore.setItem(draftKey, 'first edit')
  await new Promise(resolve => setImmediate(resolve))
  store.localStore.setItem(draftKey, 'second edit')
  release()
  await store.flushStorage()
  assert.equal(remote.entries[draftKey], 'second edit')
  assert.equal(cached.getItem(journalKey), null)
})

test('invalid server responses and corrupt pending data preserve the cached draft and expose a startup issue', async () => {
  for (const invalid of [null, [], { [draftKey]: 7 }, { unrelated: 'value' }]) {
    const cached = storage({ [draftKey]: 'keep me' })
    const store = createLocalStore({ storage: cached, request: async () => response({ entries: invalid }), onError() {} })
    await store.initializeStorage()
    assert.equal(cached.getItem(draftKey), 'keep me')
    assert.match(store.storageIssue(), /invalid progress/)
  }
  const cached = storage({ [draftKey]: 'keep me', [journalKey]: 'broken JSON' })
  const store = createLocalStore({ storage: cached, request: server({ [draftKey]: 'older' }).request, onError() {} })
  await store.initializeStorage()
  assert.equal(cached.getItem(draftKey), 'keep me')
  assert.match(store.storageIssue(), /Pending local saves/)
})

test('cache quota failure rolls back a multi-entry update', async () => {
  const cached = storage({ [draftKey]: 'old' })
  const original = cached.setItem
  cached.setItem = (key, value) => {
    if (value === 'too large') throw new Error('Quota exceeded')
    original(key, value)
  }
  const store = createLocalStore({ storage: cached, request: async () => response({}), onError() {} })
  assert.throws(() => store.localStore.setEntries({ [draftKey]: 'replacement', 'code-reps:new': 'too large' }), /Quota/)
  assert.equal(cached.getItem(draftKey), 'old')
  assert.equal(cached.getItem('code-reps:new'), null)
})

test('browser-only development still saves without a server journal', async () => {
  const cached = storage()
  const store = createLocalStore({
    storage: cached,
    request: async () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
    onError() {},
  })
  await store.initializeStorage()
  store.localStore.setItem(draftKey, 'browser draft')
  await store.flushStorage()
  assert.equal(store.isServerReady(), false)
  assert.equal(cached.getItem(journalKey), null)
})

test('browser and server share one saved-key allow-list; browser-only keys never sync', () => {
  const shared = ['code-reps:history:v1', 'code-reps:profile:default:draft:sum-evens', `code-reps:${'a'.repeat(149)}`]
  const rejected = [
    'Code-Reps:history',
    'code-reps:',
    'code-reps:has space',
    'code-reps:under_score',
    'other:key',
    `code-reps:${'a'.repeat(150)}`,
  ]
  for (const key of shared) assert.ok(storageKeyAllowed(key) && keyAllowed(key), key)
  for (const key of rejected) assert.ok(!storageKeyAllowed(key) && !keyAllowed(key), key)
  for (const key of ['code-reps:pending-writes:v1', 'code-reps:server-mode:v1', migrationKey]) {
    assert.ok(storageKeyAllowed(key), key)
    assert.ok(!keyAllowed(key), key)
  }
  assert.equal(storageKeyAllowed(42), false)
})

test('pending saves against an empty server keep, and send, the whole browser copy', async () => {
  // A new or replaced data folder: the browser has history and profiles plus an unsent edit.
  const kept = { 'code-reps:history:v1': '[{"id":"one"}]', 'code-reps:profiles:v1': '{"version":1}', [draftKey]: 'unsent edit' }
  const cached = storage({ ...kept, 'code-reps:server-mode:v1': 'true', [journalKey]: JSON.stringify({ [draftKey]: 'unsent edit' }) })
  const remote = server()
  const store = createLocalStore({ storage: cached, request: remote.request, onError() {} })
  await store.initializeStorage()
  assert.equal(store.storageIssue(), '')
  assert.deepEqual(remote.entries, kept)
  for (const [key, value] of Object.entries(kept)) assert.equal(cached.getItem(key), value, key)
  assert.equal(cached.getItem(journalKey), null)
  assert.equal(cached.getItem(migrationKey), null)
})

test('an interrupted copy to an empty server resumes instead of pruning what it had not sent', async () => {
  const local = Object.fromEntries(Array.from({ length: 1200 }, (_, index) => [`code-reps:attempt:rep-${index}:v1`, `draft ${index}`]))
  const cached = storage(local)
  const remote = server()
  let patches = 0
  const flaky = async (url, options) => {
    if (url === '/api/entries' && ++patches === 2) throw new TypeError('offline')
    return remote.request(url, options)
  }
  const first = createLocalStore({ storage: cached, request: flaky, onError() {} })
  await first.initializeStorage()
  assert.match(first.storageIssue(), /unavailable/)
  assert.ok(Object.keys(remote.entries).length < 1200)
  assert.equal(cached.getItem(migrationKey), 'true')
  const restarted = createLocalStore({ storage: cached, request: remote.request, onError() {} })
  await restarted.initializeStorage()
  assert.equal(restarted.storageIssue(), '')
  assert.deepEqual(remote.entries, local)
  for (const [key, value] of Object.entries(local)) assert.equal(cached.getItem(key), value, key)
  assert.equal(cached.getItem(migrationKey), null)
})

test('large saves split into requests the server accepts', async () => {
  const many = Object.fromEntries(Array.from({ length: 1200 }, (_, index) => [`code-reps:attempt:rep-${index}:v1`, `draft ${index}`]))
  const big = { 'code-reps:history:v1': 'é'.repeat(3_000_000), 'code-reps:fluency:v1': 'f'.repeat(3_000_000) }
  const remote = server({ 'code-reps:selected-rep': 'one' })
  const store = createLocalStore({ storage: storage(), request: remote.request, onError() {} })
  await store.initializeStorage()
  store.localStore.setEntries({ ...many, ...big })
  await store.flushStorage()
  assert.deepEqual(remote.entries, { 'code-reps:selected-rep': 'one', ...many, ...big })
  const patches = remote.calls.filter(call => call.url === '/api/entries')
  assert.ok(patches.length >= 4, `${patches.length} requests`)
  for (const call of patches) assert.ok(Object.keys(JSON.parse(call.options.body).entries).length <= maxEntriesPerRequest)
})

test('request batches respect both the key and byte budgets, and a single large value goes alone', () => {
  const entries = Object.fromEntries(Array.from({ length: 1001 }, (_, index) => [`code-reps:k${index}`, 'v']))
  assert.deepEqual(
    requestBatches(entries).map(batch => Object.keys(batch).length),
    [maxEntriesPerRequest, maxEntriesPerRequest, 1],
  )
  const large = 'x'.repeat(requestBatchBytes)
  const batches = requestBatches({ 'code-reps:a': 'small', 'code-reps:b': large, 'code-reps:c': null })
  assert.deepEqual(batches.map(Object.keys), [['code-reps:a'], ['code-reps:b'], ['code-reps:c']])
  assert.deepEqual(requestBatches({}), [])
})

test('an edit made while startup waits on the server is not replaced by the older server copy', async () => {
  const cached = storage({
    [draftKey]: 'unsent',
    'code-reps:server-mode:v1': 'true',
    [journalKey]: JSON.stringify({ [draftKey]: 'unsent' }),
  })
  const remote = server({ [draftKey]: 'old server draft', 'code-reps:history:v1': '[]' })
  let store
  let patches = 0
  let release
  const held = new Promise(resolve => {
    release = resolve
  })
  store = createLocalStore({
    storage: cached,
    onError() {},
    request: async (url, options) => {
      if (url === '/api/entries' && ++patches === 2) await held
      const result = await remote.request(url, options)
      // The learner types right after the recovered save is acknowledged; that edit's own save is slow.
      if (url === '/api/entries' && patches === 1) store.localStore.setItem(draftKey, 'typed during startup')
      return result
    },
  })
  await store.initializeStorage()
  assert.equal(cached.getItem(draftKey), 'typed during startup')
  release()
  await store.flushStorage()
  assert.equal(remote.entries[draftKey], 'typed during startup')
})
