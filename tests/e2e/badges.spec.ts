import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chooseOption, chooseSegment, editor, expectChecksFinished, replaceCode, route, solution } from './helpers'

// The first rep of the Foundations path earns the first-rep badge and the first stage's progress.
const firstRep = 'most-frequent-number'
const noticeText = /Badge earned: First rep/

const firstStepRep = {
  id: 'declare-variables',
  plan: 'Use const for the greeting and let for the message, then combine them.',
  code: 'function makeGreeting(name: string): string {\n  const greeting = "Hello, "\n  let message = greeting + name\n  return message\n}\n',
  explanation: 'It builds the greeting with const, then adds the name with let.',
}
const secondRep = {
  id: 'basic-types',
  plan: 'Name and string, age number, active boolean, then format one sentence.',
  code: 'function describePerson(name: string, age: number, active: boolean): string {\n  return `${name} is ${age}. Active: ${active}`\n}\n',
  explanation: 'A template string fills in the three values and prints the boolean as true or false.',
}

/** Finish the open rep: plan, checks, explanation, and review. Caller navigates to the rep first. */
async function finishRep(page: Page, rep: { id: string; plan: string; code: string; explanation: string }) {
  await page.getByRole('button', { name: 'Plan', exact: true }).first().click()
  await page.getByLabel('Your plan', { exact: true }).fill(rep.plan)
  await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
  await replaceCode(page, rep.code, rep.id)
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).first().click()
  await page.getByLabel('Your explanation', { exact: true }).fill(rep.explanation)
  await page.getByRole('button', { name: 'Review', exact: true }).first().click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
}

async function completeFirstRep(page: Page) {
  await page.goto(route)
  await finishRep(page, { id: firstRep, plan: 'Count each value, then keep the most frequent one with the smallest tie-break.', code: solution, explanation: 'I counted each number in a map, then compared counts and kept the smallest value on ties.' })
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

test('two reps back to back show the first-rep notice once, even when the learner moves on at once', async ({ page }) => {
  await page.goto('/#/practice/declare-variables')
  await finishRep(page, firstStepRep)
  await expect(page.locator('.completion-panel .badge-notice')).toHaveText(noticeText)
  // Move on at once, well inside the eight-second notice window. Negative checks read the page once after a short settle:
  // a retrying assertion would wait out the timer and pass even if the notice had been repeated.
  await page.locator('.completion-panel').getByRole('button', { name: /^Next rep/ }).click()
  await page.waitForTimeout(500)
  expect(await page.locator('.badge-notice').count()).toBe(0)
  await finishRep(page, secondRep)
  await page.waitForTimeout(500)
  expect(await page.getByText(/Badge earned/).count()).toBe(0)
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
  await expect(page.locator('.badge-upcoming .list-rows li').first()).toBeVisible()
  expect(await fits()).toBe(true)
  const card = await page.locator('.badge-card').first().boundingBox()
  expect(card!.x).toBeGreaterThanOrEqual(0)
  expect(card!.x + card!.width).toBeLessThanOrEqual(390)
})
