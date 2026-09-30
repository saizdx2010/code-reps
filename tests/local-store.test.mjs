import assert from 'node:assert/strict'
import test from 'node:test'
import { createLocalStore } from '../src/local-store.ts'

const draftKey = 'code-reps:attempt:sum-positive-numbers:v1'
const journalKey = 'code-reps:pending-writes:v1'
function storage(entries = {}) {
  const map = new Map(Object.entries(entries))
  return { get length() { return map.size }, key: index => [...map.keys()][index] ?? null, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }
}
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
function server(initial = {}) {
  const entries = { ...initial }, calls = []
  let available = true
  const request = async (url, options) => {
    calls.push({ url, options })
    if (!available) throw new TypeError('offline')
    if (url === '/api/state') return response({ entries: { ...entries } })
    const body = JSON.parse(options.body)
    if (url === '/api/migrate') { if (!Object.keys(entries).length) Object.assign(entries, body.entries); return response({ entries }) }
    assert.equal(url, '/api/entries')
    assert.equal(options.method, 'PATCH')
    for (const [key, value] of Object.entries(body.entries)) { if (value === null) delete entries[key]; else entries[key] = value }
    return response({ saved: true })
  }
  return { entries, calls, request, offline: () => { available = false }, online: () => { available = true } }
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
  const store = createLocalStore({ storage: cached, onError() {}, request: async (url, options) => {
    if (url === '/api/entries' && firstPatch) { firstPatch = false; await new Promise(resolve => { release = resolve }) }
    return remote.request(url, options)
  } })
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
  cached.setItem = (key, value) => { if (value === 'too large') throw new Error('Quota exceeded'); original(key, value) }
  const store = createLocalStore({ storage: cached, request: async () => response({}), onError() {} })
  assert.throws(() => store.localStore.setEntries({ [draftKey]: 'replacement', 'code-reps:new': 'too large' }), /Quota/)
  assert.equal(cached.getItem(draftKey), 'old')
  assert.equal(cached.getItem('code-reps:new'), null)
})

test('browser-only development still saves without a server journal', async () => {
  const cached = storage()
  const store = createLocalStore({ storage: cached, request: async () => new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }), onError() {} })
  await store.initializeStorage()
  store.localStore.setItem(draftKey, 'browser draft')
  await store.flushStorage()
  assert.equal(store.isServerReady(), false)
  assert.equal(cached.getItem(journalKey), null)
})
