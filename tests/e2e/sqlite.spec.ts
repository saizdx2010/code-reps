import { expect, test as base } from '@playwright/test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { startServer } from '../../server/index.mjs'
import { expectChecksFinished, editor, replaceCode, route, solution } from './helpers'

type Service = { url: string; restart: () => Promise<void> }
const test = base.extend<{ service: Service }>({
  // Playwright requires a destructured fixture parameter even with no dependencies.
  // eslint-disable-next-line no-empty-pattern
  service: async ({}, provide) => {
    const dataDir = await mkdtemp(join(tmpdir(), 'code-reps-browser-'))
    let running = await startServer({ port: 0, dataDir })
    const url = running.url
    try {
      await provide({ url, restart: async () => {
        const port = running.server.address().port
        await running.close()
        running = await startServer({ port, dataDir })
      } })
    } finally {
      await running.close()
      await rm(dataDir, { recursive: true, force: true })
    }
  },
})

test('records local Home and editor readiness alongside bundle budgets', async ({ page, service }, testInfo) => {
  await page.goto(service.url + '/#/home')
  await expect(page.getByRole('heading', { name: 'Where are you starting?' })).toBeVisible()
  const homeReadyMs = await page.evaluate(() => performance.now())
  await page.goto(service.url + route)
  await expect(editor(page)).toBeVisible()
  const editorReadyMs = await page.evaluate(() => performance.now())
  const bundle = JSON.parse(await readFile('dist/bundle-size.json', 'utf8'))
  await testInfo.attach('local-readiness-and-bundle-size', {
    body: JSON.stringify({ homeReadyMs, editorReadyMs, bundle }, null, 2),
    contentType: 'application/json',
  })
  // Timing is observational: shared CI machines cannot provide a stable speed gate.
})

async function serverPlan(url: string) {
  const { entries } = await (await fetch(`${url}/api/state`)).json()
  return Object.entries(entries).filter(([key]) => key.includes('most-frequent-number'))
    .map(([, value]) => JSON.parse(String(value)).plan)
}

test('SQLite save failure, retry, and restart preserve the newest browser draft', async ({ page, browser, service }) => {
  await page.goto(service.url + route)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Already saved plan')
  await expect.poll(() => serverPlan(service.url)).toContain('Already saved plan')
  let failWrites = true
  await page.route('**/api/entries', request => failWrites
    ? request.fulfill({ status: 503, json: { error: 'Test save failure' } }) : request.continue())
  await page.getByLabel('Your plan', { exact: true }).fill('Newest plan kept during failure')
  const recovery = page.locator('.storage-recovery')
  await expect(recovery.getByRole('button', { name: 'Retry saving' })).toBeVisible()
  expect(await serverPlan(service.url)).toContain('Already saved plan')
  const downloadPromise = page.waitForEvent('download')
  await recovery.getByRole('button', { name: 'Download backup' }).click()
  const download = await downloadPromise
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'))
  expect(backup.drafts['most-frequent-number'].plan).toBe('Newest plan kept during failure')
  // Reload must replay the journal without overwriting it with the older SQLite copy.
  await page.reload()
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Newest plan kept during failure')
  failWrites = false
  await recovery.getByRole('button', { name: 'Retry saving' }).click()
  await expect(recovery).toHaveCount(0)
  await expect.poll(() => serverPlan(service.url)).toContain('Newest plan kept during failure')
  await page.close()
  await service.restart()
  const clean = await browser.newContext()
  try {
    const restored = await clean.newPage()
    await restored.goto(service.url + route)
    await restored.getByRole('button', { name: 'Plan', exact: true }).click()
    await expect(restored.getByLabel('Your plan', { exact: true })).toHaveValue('Newest plan kept during failure')
    await expect(restored.getByText('Saved on this laptop', { exact: true }).filter({ visible: true })).toBeVisible()
  } finally { await clean.close() }
})

test('an older SQLite acknowledgement cannot discard a newer pending edit', async ({ page, service }) => {
  await page.goto(service.url + route)
  await expect(page.getByText('Saved on this laptop', { exact: true }).filter({ visible: true })).toBeVisible()
  let release = () => {}
  const gate = new Promise<void>(resolve => { release = resolve })
  let held = false
  await page.route('**/api/entries', async request => {
    if (!held && request.request().postData()?.includes('Older edit awaiting acknowledgement')) {
      held = true
      await gate
    }
    await request.continue()
  })
  try {
    await page.getByRole('button', { name: 'Plan', exact: true }).click()
    await page.getByLabel('Your plan', { exact: true }).fill('Older edit awaiting acknowledgement')
    await expect.poll(() => held).toBe(true)
    await page.getByLabel('Your plan', { exact: true }).fill('Newer edit awaiting acknowledgement')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('code-reps:pending-writes:v1'))).toContain('Newer edit awaiting acknowledgement')
    release()
    await expect.poll(() => serverPlan(service.url)).toContain('Newer edit awaiting acknowledgement')
    await expect.poll(() => page.evaluate(() => localStorage.getItem('code-reps:pending-writes:v1'))).toBeNull()
    await page.reload()
    await page.getByRole('button', { name: 'Plan', exact: true }).click()
    await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Newer edit awaiting acknowledgement')
  } finally { release() }
})

test('browser backup validation preserves work and a valid restore reaches SQLite', async ({ page, service }) => {
  await page.goto(service.url + route)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Exported plan')
  await replaceCode(page, solution)
  await page.goto(service.url + '/#/progress')
  await page.locator('.local-data > summary').click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup', exact: true }).click()
  const contents = await readFile((await (await downloadPromise).path())!)
  await page.getByLabel('Choose Code Reps backup').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') })
  await expect(page.locator('.transfer-message')).toBeVisible()
  await expect(page.locator('.transfer-message')).not.toContainText('Backup downloaded')
  await page.goto(service.url + route)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Exported plan')
  await page.getByRole('button', { name: 'Manage profiles' }).click()
  const dialog = page.getByRole('dialog', { name: 'Local profiles' })
  await dialog.getByText('Create or rename a profile', { exact: true }).click()
  await dialog.getByLabel('Profile name', { exact: true }).fill('Restored learner')
  await dialog.getByRole('button', { name: 'Create profile', exact: true }).click()
  await expect(dialog.getByRole('status')).toHaveText('Profile created.')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto(service.url + '/#/progress')
  await page.locator('.local-data > summary').click()
  await Promise.all([
    page.waitForEvent('load'),
    page.getByLabel('Choose Code Reps backup').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: contents }),
  ])
  await expect(page.locator('.transfer-message')).toHaveCount(0)
  await page.goto(service.url + route)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Exported plan')
  await expect(editor(page)).toBeVisible()
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await expect.poll(() => serverPlan(service.url)).toEqual(['Exported plan', 'Exported plan'])
})

test('cold local-server editing, worker checks, and previews need no external requests', async ({ page, service }) => {
  const external: string[] = []
  await page.route('**/*', request => {
    const url = new URL(request.request().url())
    if (url.protocol === 'http:' && url.origin === service.url) return request.continue()
    external.push(url.href)
    return request.abort()
  })
  await page.goto(service.url + '/#/home')
  await page.goto(service.url + route)
  await replaceCode(page, solution)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  const { richSolutions } = await import('../fixtures/rich-solutions.mjs')
  await page.goto(service.url + '/#/practice/frontend-directory')
  await replaceCode(page, richSolutions['frontend-directory'], 'frontend-directory')
  await page.getByRole('button', { name: 'Update preview', exact: true }).click()
  await expect(page.frameLocator('iframe[title="Your directory implementation"]').getByLabel('Search people')).toBeVisible()
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  expect(external).toEqual([])
})

test('session endings replay after SQLite failure and restore through learner backup', async ({ page, service }) => {
  const sessionKey = 'code-reps:profile:default:sessions:v1'
  await page.goto(service.url + '/#/practice/sum-positive-numbers')
  await page.getByRole('button', { name: 'Start practice', exact: true }).click()
  await page.getByRole('button', { name: 'Reflect and end session', exact: true }).click()
  let failWrites = true
  await page.route('**/api/entries', request => failWrites ? request.fulfill({ status: 503, json: { error: 'Test session save failure' } }) : request.continue())
  await page.getByLabel('What did you learn or where did you get stuck?').fill('Session saved locally during service failure')
  await page.getByRole('button', { name: 'End session', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Session saved' })).toBeVisible()
  await expect(page.locator('.session-save')).toContainText('waiting for the local server')
  const downloading = page.waitForEvent('download')
  await page.locator('.session-save').getByRole('button', { name: 'Download recovery backup' }).click()
  const contents = await readFile((await (await downloading).path())!)
  expect(JSON.parse(contents.toString()).sessions.records[0].endedAt).toBeTruthy()
  failWrites = false
  await page.locator('.session-save').getByRole('button', { name: 'Retry session save' }).click()
  await expect.poll(async () => {
    const { entries } = await (await fetch(service.url + '/api/state')).json()
    return JSON.parse(entries[sessionKey] || '{"records":[]}').records[0]?.reflection
  }).toBe('Session saved locally during service failure')
  await page.reload()
  await page.goto(service.url + '/#/sessions')
  await expect(page.getByText('Session saved locally during service failure', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete record…' }).click()
  await page.getByRole('button', { name: 'Remove session record' }).click()
  await expect(page.getByText('No ended sessions yet.', { exact: false })).toBeVisible()
  await page.goto(service.url + '/#/progress')
  await page.locator('.local-data > summary').click()
  await Promise.all([page.waitForEvent('load'), page.getByLabel('Choose Code Reps backup').setInputFiles({ name: 'sessions.json', mimeType: 'application/json', buffer: contents })])
  await page.goto(service.url + '/#/sessions')
  await expect(page.getByText('Session saved locally during service failure', { exact: true })).toBeVisible()
})
