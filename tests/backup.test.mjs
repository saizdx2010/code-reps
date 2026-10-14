import assert from 'node:assert/strict'
import test from 'node:test'

// downloadBackup runs in the browser; stand in for its storage and download link.
const saved = new Map()
globalThis.localStorage = {
  getItem: key => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, String(value)),
  removeItem: key => saved.delete(key),
  key: index => [...saved.keys()][index] ?? null,
  get length() {
    return saved.size
  },
}
const downloads = []
URL.createObjectURL = blob => {
  downloads.push(blob)
  return 'blob:backup'
}
URL.revokeObjectURL = () => {}
globalThis.document = { createElement: () => ({ click() {} }) }
globalThis.window = { setTimeout: () => 0 }

const { downloadBackup } = await import('../src/backup.ts')
const { backupTextLimit, backupTooLargeMessage, parseBackup } = await import('../src/portability.ts')
const { repIndex } = await import('../src/catalog-index.ts')
const { emptyFluency } = await import('../src/fluency.ts')
const { emptySessions } = await import('../src/practice-sessions.ts')

const repId = repIndex[0].id
const work = code => ({
  attempt: { plan: 'Visit each value', code, explanation: '', hintCount: 0 },
  repId,
  learnerStart: 'new',
  history: [],
  learning: emptyFluency(),
  sessions: { backup: emptySessions },
})

test('a backup downloads the open draft and restores', async () => {
  downloads.length = 0
  assert.equal(downloadBackup(work('return 1')), 'Backup downloaded to this device.')
  assert.equal(downloads.length, 1)
  const restored = parseBackup(await downloads[0].text(), new Set(repIndex.map(rep => rep.id)))
  assert.equal(restored.drafts[repId].code, 'return 1')
  assert.equal(restored.learnerStart, 'new')
})

test('a backup over the import limit is refused with a message and nothing is downloaded', () => {
  downloads.length = 0
  assert.equal(downloadBackup(work('x'.repeat(backupTextLimit))), backupTooLargeMessage)
  assert.equal(downloads.length, 0)
})

test('other export failures keep the general message', () => {
  downloads.length = 0
  const failing = {
    ...work('return 1'),
    sessions: {
      backup: () => {
        throw new Error('Session records are unreadable.')
      },
    },
  }
  assert.equal(downloadBackup(failing), 'The backup could not be created on this device.')
  assert.equal(downloads.length, 0)
})
