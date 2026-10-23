import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const day = 86_400_000
const ago = (days: number) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  return new Date(Math.min(date.getTime() - days * day, Date.now() - 60_000)).toISOString()
}
const record = (repId: string, daysAgo: number, hintCount = 0) => ({
  id: `${repId}-${daysAgo}`,
  repId,
  completedAt: ago(daysAgo),
  plan: 'plan',
  code: 'code',
  explanation: 'explanation',
  hintCount,
})
async function seed(page: Page, history: ReturnType<typeof record>[]) {
  await page.goto('/#/home')
  await page.evaluate(value => {
    localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(value))
    for (const item of [...value].reverse()) {
      const { id: _id, repId, ...attempt } = item
      localStorage.setItem(`code-reps:profile:default:attempt:${repId}:v1`, JSON.stringify(attempt))
    }
  }, history)
  await page.reload()
}

test('after days away, Trail welcomes the learner back with their reason and one familiar rep', async ({ page }) => {
  await seed(page, [record('declare-variables', 9), record('count-even-numbers', 5)])
  const welcome = page.locator('.welcome-back')
  await expect(welcome.getByRole('heading')).toHaveText('5 days away, and nothing was lost.')
  await welcome.getByLabel('Why are you learning? One line, shown here next time.').fill('Build my own budgeting app.')
  await welcome.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(welcome.locator('blockquote')).toHaveText('Build my own budgeting app.')

  // Skipping hides it for the rest of the day, across a refresh.
  await welcome.getByRole('button', { name: 'Skip to my plan' }).click()
  await expect(welcome).toHaveCount(0)
  await page.reload()
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.locator('.welcome-back')).toHaveCount(0)
})

test('the welcome eases back in with a rep finished before, not the one the next panel suggests', async ({ page }) => {
  await seed(page, [record('declare-variables', 8), record('count-even-numbers', 6)])
  const suggested = await page.locator('#continue-heading').textContent()
  const ease = page.locator('.welcome-back').getByRole('button', { name: /^Ease back in: / })
  const familiar = (await ease.textContent())!.replace('Ease back in: ', '').trim()
  expect(familiar).not.toBe(suggested)
  await ease.click()
  await expect(page).toHaveURL(/#\/practice\/[a-z0-9-]+$/)
  await expect(page.locator('h1')).toHaveText(familiar)
})

test('a slowing rhythm offers a lighter target and a different kind of rep', async ({ page }) => {
  await seed(page, [
    ...[16, 18, 20, 22, 25].map((days, index) =>
      record(['declare-variables', 'basic-types', 'count-even-numbers', 'sum-positive-numbers', 'write-functions'][index], days),
    ),
    record('declare-variables', 2),
  ])
  const nudge = page.locator('.rhythm-nudge')
  await expect(nudge).toContainText('5 practice days in the two weeks before, 1 in the last two.')
  await nudge.getByRole('button', { name: 'Aim for 1 day a week' }).click()
  await page.goto('/#/progress')
  await expect(page.locator('.rhythm-stat').filter({ hasText: 'Days this week' }).locator('b')).toHaveText(/of 1$/)
  await page.locator('.rhythm-nudge').getByRole('button', { name: 'Not now' }).click()
  await expect(page.locator('.rhythm-nudge')).toHaveCount(0)
  await page.goto('/#/home')
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.locator('.rhythm-nudge')).toHaveCount(0)
})

test('the plan page saves a reason, downloads a calendar file, and turns on reminders', async ({ page }) => {
  // Headless Chromium has no notification permission prompt; this stands in for a learner who allows it.
  await page.addInitScript(() => {
    class AllowedNotification {
      static permission = 'default'
      static requestPermission = async () => (AllowedNotification.permission = 'granted')
    }
    Object.defineProperty(window, 'Notification', { value: AllowedNotification, configurable: true })
  })
  await page.goto('/#/plan')
  const section = page.locator('.come-back-settings')
  await section.getByLabel(/Why you practice/).fill('Pass my interviews in March.')
  await section.getByLabel('Practice time').fill('07:30')
  await expect(section.getByRole('status')).toHaveText('Reason saved.')
  const download = page.waitForEvent('download')
  await section.getByRole('button', { name: 'Add to my calendar' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('code-reps-practice.ics')
  const text = await (await file.createReadStream()).toArray().then(chunks => Buffer.concat(chunks).toString('utf8'))
  expect(text).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')
  expect(text).toMatch(/DTSTART:\d{8}T073000/)
  expect(text.replace(/\r\n /g, '')).toContain('Why: Pass my interviews in March.')

  await section.getByRole('button', { name: 'Remind me while Code Reps is open' }).click()
  await expect(section.getByRole('status')).toHaveText('Reminders are on while Code Reps is open.')
  await page.reload()
  await expect(page.locator('.come-back-settings').getByRole('button', { name: 'Remind me while Code Reps is open' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.locator('.come-back-settings').getByLabel(/Why you practice/)).toHaveValue('Pass my interviews in March.')
})

test('the app can be installed: the manifest and its icons are served', async ({ page }) => {
  const response = await page.request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)
  const manifest = await response.json()
  expect(manifest.name).toBe('Code Reps')
  for (const icon of manifest.icons) expect((await page.request.get(icon.src)).ok()).toBe(true)
  await page.goto('/#/home')
  await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href', '/manifest.webmanifest')
})
