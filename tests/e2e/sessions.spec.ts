import { expect, test } from '@playwright/test'

const repId = 'sum-positive-numbers'
const sessionKey = 'code-reps:profile:default:sessions:v1'

test('practice sessions are not offered in the workspace, Home, or Journal', async ({ page }) => {
  await page.goto(`/#/practice/${repId}`)
  await expect(page.getByRole('button', { name: 'Record a session' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reflect and end session' })).toHaveCount(0)
  await page.goto('/#/home')
  await expect(page.getByText('Unfinished sessions')).toHaveCount(0)
  await page.goto('/#/history')
  await expect(page.getByRole('group', { name: 'Journal' }).getByRole('button', { name: 'Practice sessions' })).toHaveCount(0)
  expect(await page.evaluate(key => localStorage.getItem(key), sessionKey)).toBeNull()
})

test('a bookmarked sessions route opens the Journal', async ({ page }) => {
  await page.goto('/#/sessions')
  await expect(page).toHaveURL(/#\/history$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Attempt history' })).toBeVisible()
})

test('a backup with invalid legacy session records is rejected and keeps existing data', async ({ page }) => {
  const key = 'code-reps:profile:default:sessions:v1'
  const legacy = JSON.stringify({ version: 1, revision: 'r1', records: [] })
  await page.goto('/#/progress')
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, legacy])
  await page.reload()
  await page.getByText('Back up or restore practice', { exact: true }).click()
  const invalid = { format: 'code-reps-backup', version: 1, learnerStart: null, history: [], drafts: {}, sessions: { version: 1, revision: '', records: [{ bad: true }] } }
  await page.getByLabel('Choose Code Reps backup').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) })
  await expect(page.locator('.transfer-message')).toContainText('invalid session')
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe(legacy)
})
