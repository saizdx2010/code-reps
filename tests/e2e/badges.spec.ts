import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chooseOption, chooseSegment, editor, expectChecksFinished, replaceCode, route, solution } from './helpers'

// The first rep of the Foundations path earns the first-rep badge and the first stage's progress.
const firstRep = 'most-frequent-number'
const noticeText = /Badge earned: First rep/

async function completeFirstRep(page: Page) {
  await page.goto(route)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Count each value, then keep the most frequent one with the smallest tie-break.')
  await page.getByRole('button', { name: 'Solve', exact: true }).click()
  await replaceCode(page, solution, firstRep)
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByLabel('Your explanation', { exact: true }).fill('I counted each number in a map, then compared counts and kept the smallest value on ties.')
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await chooseSegment(page, 'How confident do you feel?', 'Confident')
  await page.getByRole('button', { name: 'Complete rep', exact: false }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
}

async function createProfile(page: Page, name: string) {
  await page.locator('.profile-trigger').click()
  const dialog = page.getByRole('dialog', { name: 'Local profiles' })
  await dialog.getByText('Create or rename a profile', { exact: true }).click()
  await dialog.getByLabel('Profile name', { exact: true }).fill(name)
  await dialog.getByRole('button', { name: 'Create profile', exact: true }).click()
  await expect(dialog.getByRole('status')).toHaveText('Profile created.')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
}

async function switchProfile(page: Page, label: string) {
  await page.locator('.profile-trigger').click()
  const dialog = page.getByRole('dialog', { name: 'Local profiles' })
  await chooseOption(dialog.getByRole('combobox', { name: 'Switch profile', exact: true }), { label })
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto('/#/progress')
}

async function downloadBackup(page: Page) {
  await page.goto('/#/progress')
  await page.getByText('Back up or restore practice', { exact: true }).click()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup', exact: true }).click()
  const download = await downloading
  return readFile((await download.path())!, 'utf8')
}

test('a milestone shows one quiet notice that does not take focus or repeat after reload', async ({ page }) => {
  await page.goto('/#/progress')
  await expect(page.locator('.badge-notice')).toHaveCount(0)
  await completeFirstRep(page)
  const notice = page.locator('.badge-notice')
  await expect(notice).toBeVisible()
  await expect(notice).toHaveText(noticeText)
  await expect(page.locator('.completion-panel .badge-notice')).toBeVisible()
  expect(await notice.evaluate(element => getComputedStyle(element).position)).not.toBe('fixed')
  expect(await notice.evaluate(element => element.contains(document.activeElement))).toBe(false)
  await page.reload()
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.badge-notice')).toHaveCount(0)
  await page.goto('/#/progress')
  await expect(page.locator('.badge-count')).toHaveText(/^1 of \d+ earned/)
  await expect(page.locator('.badge-notice')).toHaveCount(0)
})

test('badges follow the active profile across a profile switch and stay after switching back', async ({ page }) => {
  await completeFirstRep(page)
  await expect(page.locator('.badge-notice')).toHaveText(noticeText)
  await page.goto('/#/progress')
  await expect(page.locator('.badge-count')).toHaveText(/^1 of \d+ earned/)
  await createProfile(page, 'Badge check learner')
  await switchProfile(page, 'Badge check learner')
  await expect(page.getByRole('heading', { name: 'Badge check learner', exact: true })).toBeVisible()
  await expect(page.locator('.badge-count')).toHaveText(/^0 of \d+ earned/)
  await expect(page.locator('.badge-notice')).toHaveCount(0)
  await switchProfile(page, 'My learning')
  await expect(page.locator('.badge-count')).toHaveText(/^1 of \d+ earned/)
  // The earlier acknowledgement belongs to this profile in this session, so switching back does not replay it.
  await expect(page.locator('.badge-notice')).toHaveCount(0)
})

test('a backup exported from one profile earns the same badges after import into another', async ({ page }) => {
  await completeFirstRep(page)
  const backup = await downloadBackup(page)
  await createProfile(page, 'Imported learner')
  await switchProfile(page, 'Imported learner')
  await expect(page.locator('.badge-count')).toHaveText(/^0 of \d+ earned/)
  const directory = await mkdtemp(join(tmpdir(), 'code-reps-badges-'))
  const file = join(directory, 'practice-backup.json')
  await writeFile(file, backup)
  await page.getByText('Back up or restore practice', { exact: true }).click()
  await page.getByLabel('Choose Code Reps backup').setInputFiles(file)
  await expect(page.locator('.badge-count')).toHaveText(/^1 of \d+ earned/)
  await expect(page.locator('.badge-grid').getByText('First rep', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('.badge-count')).toHaveText(/^1 of \d+ earned/)
  await expect(page.locator('.badge-grid').getByText('First rep', { exact: true })).toBeVisible()
})

test('earned and upcoming badges fit a 390px layout without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const fits = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  await completeFirstRep(page)
  // The notice is checked before it is acknowledged away: it must sit inside the 390px viewport.
  await expect(page.locator('.badge-notice')).toBeVisible()
  const notice = await page.locator('.badge-notice').boundingBox()
  expect(notice!.x).toBeGreaterThanOrEqual(0)
  expect(notice!.x + notice!.width).toBeLessThanOrEqual(390)
  expect(await fits()).toBe(true)
  await page.goto('/#/progress')
  await expect(page.getByRole('heading', { name: 'Completion badges' })).toBeVisible()
  await expect(page.locator('.badge-grid').getByText('First rep', { exact: true })).toBeVisible()
  await page.getByText(/Upcoming badges/).click()
  await expect(page.locator('.badge-upcoming .compact-path-list li').first()).toBeVisible()
  expect(await fits()).toBe(true)
  const card = await page.locator('.badge-card').first().boundingBox()
  expect(card!.x).toBeGreaterThanOrEqual(0)
  expect(card!.x + card!.width).toBeLessThanOrEqual(390)
})
