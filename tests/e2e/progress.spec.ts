import { expect, test } from '@playwright/test'

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()
const record = (repId: string, daysAgo: number, hintCount = 0) => ({
  id: `${repId}-${daysAgo}`,
  repId,
  completedAt: day(daysAgo),
  plan: 'plan',
  code: 'code',
  explanation: 'explanation',
  hintCount,
  confidence: 'getting-there',
  difficulty: 'none',
})
// Arrays: guided then independent long ago (recall due). Words: guided then independent recently (recall waiting).
// Count and remember: a hinted guided rep only.
const history = [
  record('sum-positive-numbers', 9, 1),
  record('count-even-numbers', 8),
  record('count-words', 6),
  record('first-long-word', 1),
  record('has-duplicate', 0, 2),
]

test.beforeEach(async ({ page }) => {
  // Only this test's fresh browser context receives the sample history.
  await page.goto('/#/progress')
  await page.evaluate(value => localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(value)), history)
  await page.reload()
})

test('a due review leads the page, and every journey skill is counted once on the ladder', async ({ page }) => {
  const next = page.locator('.progress-next')
  await expect(next).toContainText('Review due')
  await expect(next.getByRole('heading', { level: 2 })).toHaveText('Count values above a limit')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Skills')
  const rung = (id: string) => page.locator(`.skill-ladder-legend [data-rung="${id}"] b`)
  await expect(rung('retained')).toHaveText('0')
  await expect(rung('independent')).toHaveText('2')
  await expect(rung('practising')).toHaveText('1')
  const counts = await page.locator('.skill-ladder-legend b').allTextContents()
  const total = counts.reduce((sum, value) => sum + Number(value), 0)
  await expect(page.locator('.skill-ladder dt small')).toContainText(`${total} journey skills`)
  await next.getByRole('button', { name: /Start review/ }).click()
  await expect(page).toHaveURL(/#\/practice\/count-above-threshold$/)
})

test('journeys are grouped by where they are, with the due recall first and a connected ladder', async ({ page }) => {
  const groups = page.locator('.journey-groups > .list-group')
  await expect(groups.locator('.list-group-title')).toHaveText(['In progress', 'Not started'])
  const inProgress = groups.first()
  await expect(inProgress).toHaveAttribute('open', '')
  await expect(inProgress.locator('.progress-journey h2').first()).toHaveText('Work through arrays')
  const markers = inProgress.locator('.journey-markers').first()
  await expect(markers.locator('[data-complete="true"]')).toHaveCount(2)
  await expect(markers.locator('[data-due]')).toHaveCount(1)
  await expect(groups.nth(1)).not.toHaveAttribute('open', '')
})

test('the practice rhythm shows the streak and the last seven days, with the longer calendar one click away', async ({ page }) => {
  const streak = page.locator('.rhythm-stat').first()
  await expect(streak.locator('b')).toHaveText('2')
  await expect(streak.locator('small')).toHaveText('Longest 3')
  // This Monday-to-Sunday week against the default target of three days; how many fall in it depends on today's weekday.
  await expect(page.locator('.rhythm-stat').nth(1).locator('b')).toHaveText(/^\d of 3$/)
  await expect(page.locator('.rhythm-stat').nth(1)).toContainText('Days this week')
  await expect(page.locator('.rhythm-key')).toContainText('Last seven days: 3 practiced')
  const week = page.getByRole('list', { name: 'The last seven days' }).locator('li')
  await expect(week).toHaveCount(7)
  await expect(week.last()).toHaveAttribute('data-today', 'true')
  await expect(week.last()).toHaveAttribute('data-kind', 'new')
  await expect(week.last()).toContainText('Today')
  await expect(page.locator('.practice-calendar')).toBeHidden()
  await page.locator('.practice-history > summary').click()
  const calendar = page.locator('.practice-calendar')
  await expect(calendar.locator('.practice-calendar-grid i[data-day="clean"]')).toHaveCount(3)
  await expect(calendar.locator('.practice-calendar-grid i[data-day="any"]')).toHaveCount(2)
  await expect(calendar).toContainText('5 days in 12 weeks')
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('a chosen backup is previewed before anything merges, and the merge leaves a receipt', async ({ page }) => {
  const backup = {
    format: 'code-reps-backup',
    version: 1,
    learnerStart: null,
    history: [history[0], record('count-even-numbers', 3)],
    drafts: { 'count-words': { plan: 'a plan from the backup', code: 'code', explanation: '', hintCount: 0 } },
  }
  const file = { name: 'practice.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) }
  await page.getByText('Back up or restore practice', { exact: true }).click()
  await page.getByLabel('Choose Code Reps backup').setInputFiles(file)
  const preview = page.locator('.restore-preview')
  await expect(preview).toContainText('practice.json is a valid practice backup.')
  await expect(preview).toContainText('Adds 1 of its 2 completed attempts; the rest are already here')
  await expect(preview).toContainText('Fills 1 empty draft')
  // Cancelling writes nothing.
  await preview.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(preview).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('code-reps:profile:default:history:v1')!).length)).toBe(5)
  await page.getByLabel('Choose Code Reps backup').setInputFiles(file)
  await Promise.all([page.waitForEvent('load'), preview.getByRole('button', { name: /^Merge into / }).click()])
  const receipt = page.locator('.restore-receipt')
  await expect(receipt.locator('.restore-receipt-text')).toHaveText(/^Backup merged into .+: 1 new attempt\.$/)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('code-reps:profile:default:history:v1')!).length)).toBe(6)
  // The receipt is shown once.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Skills')
  await expect(receipt).toHaveCount(0)
})
