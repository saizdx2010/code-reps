import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, writeFile, readdir, cp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createStore } from '../server/store.mjs'
import { startServer } from '../server/index.mjs'

test('batch writes are atomic and snapshots restore independently after queued shutdown', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code reps reliability '))
  let store
  let restored
  try {
    store = createStore(join(root, 'original'))
    store.set('code-reps:draft:one', 'original')
    assert.throws(() => store.applyEntries({ 'code-reps:draft:one': 'changed', invalid: 'bad' }))
    assert.deepEqual(store.entries(), { 'code-reps:draft:one': 'original' })
    store.applyEntries({ 'code-reps:draft:one': null, 'code-reps:history:v1': '[]' })
    const backups = join(root, 'original', 'backups')
    await mkdir(backups)
    for (let day = 1; day <= 8; day++) await writeFile(join(backups, `2020-01-0${day}.sqlite`), '')
    await writeFile(join(backups, 'keep.txt'), 'keep')
    const pending = [store.makeBackup(), store.makeBackup()]
    await store.close()
    const [snapshot, second] = await Promise.all(pending)
    assert.equal(snapshot, second)
    const files = await readdir(backups)
    assert.equal(files.filter(file => file.endsWith('.sqlite')).length, 7)
    assert.ok(files.includes('keep.txt'))
    assert.ok(!files.some(file => file.endsWith('.tmp')))
    await mkdir(join(root, 'restored'))
    await cp(snapshot, join(root, 'restored', 'progress.sqlite'))
    restored = createStore(join(root, 'restored'))
    assert.deepEqual(restored.entries(), { 'code-reps:history:v1': '[]' })
  } finally {
    await store?.close()
    await restored?.close()
    await rm(root, { recursive: true, force: true })
  }
})

test('failed snapshots can be retried without poisoning the backup queue', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code-reps-backup-'))
  const store = createStore(root)
  try {
    await writeFile(join(root, 'backups'), 'blocked')
    await assert.rejects(store.makeBackup())
    await rm(join(root, 'backups'))
    await store.makeBackup()
    assert.equal((await readdir(join(root, 'backups'))).length, 1)
  } finally { await store.close(); await rm(root, { recursive: true, force: true }) }
})

test('server handles missing assets, atomic imports, upgrades, and startup failures', async () => {
  const root = await mkdtemp(join(tmpdir(), 'code-reps-server-'))
  const assetsDir = join(root, 'app')
  const dataDir = join(root, 'data')
  let running
  try {
    await assert.rejects(startServer({ port: 0, assetsDir, dataDir }), /built app is missing/)
    await assert.rejects(readdir(dataDir), /ENOENT/)
    await mkdir(join(assetsDir, 'assets'), { recursive: true })
    await writeFile(join(assetsDir, 'index.html'), '<main>Code Reps</main>')
    await writeFile(join(assetsDir, 'assets', 'app-123.js'), 'export {}')
    running = await startServer({ port: 0, assetsDir, dataDir })
    const patch = entries => fetch(`${running.url}/api/entries`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) })
    assert.equal((await patch({ 'code-reps:draft:one': 'saved' })).status, 200)
    assert.equal((await patch({ 'code-reps:draft:one': 'bad', invalid: 'bad' })).status, 400)
    assert.deepEqual((await (await fetch(`${running.url}/api/state`)).json()).entries, { 'code-reps:draft:one': 'saved' })
    const missing = await fetch(`${running.url}/assets/missing.js`)
    assert.equal(missing.status, 404)
    assert.match(missing.headers.get('content-type'), /application\/json/)
    assert.match((await fetch(`${running.url}/assets/app-123.js`)).headers.get('cache-control'), /immutable/)
    const page = await fetch(`${running.url}/practice`)
    assert.equal(page.status, 200)
    assert.equal(page.headers.get('cache-control'), 'no-store')
    await assert.rejects(startServer({ port: running.server.address().port, assetsDir, dataDir: join(root, 'busy') }), /EADDRINUSE/)
    await running.close()
    running = await startServer({ port: 0, assetsDir, dataDir })
    assert.equal((await (await fetch(`${running.url}/api/state`)).json()).entries['code-reps:draft:one'], 'saved')
    assert.equal((await readdir(join(dataDir, 'backups'))).length, 1)
  } finally { await running?.close(); await rm(root, { recursive: true, force: true }) }
})
