import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseOption } from './helpers'

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
/** Only this test's fresh browser context receives the sample history, with each completed draft saved as it would be. */
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

test('Done for today closes the day on Trail, and the rep chosen for next time waits with its note', async ({ page }) => {
  await seed(page, [record('declare-variables', 2, 1), record('count-even-numbers', 0)])
  await page.goto('/#/practice/count-even-numbers')
  await page.getByRole('navigation', { name: 'Practice steps' }).getByRole('button', { name: 'Finish', exact: true }).click()
  await page.locator('.completion-panel').getByRole('button', { name: 'Done for today' }).click()
  await expect(page).toHaveURL(/#\/home$/)

  const closed = page.locator('.day-closed')
  await expect(closed.getByRole('heading', { name: 'Done for today' })).toBeVisible()
  await expect(closed.getByLabel('Today')).toContainText('New1')
  await expect(closed.locator('.week-meter')).toContainText(/This week: \d of 3 days/)
  // The rest of the aside steps aside: no next-practice panel competes with the close.
  await expect(page.locator('.continue-panel')).toHaveCount(0)

  const planner = closed.locator('.next-time')
  const choice = await planner.locator('select').inputValue()
  await planner.getByLabel(/Note to your future self/).fill('Start with the empty case.')
  await planner.getByRole('button', { name: 'Save for next time' }).click()
  await expect(planner.getByRole('status')).toHaveText('Saved for next time.')
  await expect(planner).toContainText('is waiting on Trail.')

  // Reopening the day (or coming back later) shows the chosen rep first, with the note, and it survives a reload.
  await closed.getByRole('button', { name: "Show today's plan" }).click()
  const panel = page.locator('.planned-panel')
  await expect(panel.locator('.home-label')).toContainText('You planned this')
  await expect(panel.locator('blockquote')).toHaveText('Start with the empty case.')
  await page.reload()
  await expect(page.locator('.planned-panel blockquote')).toHaveText('Start with the empty case.')

  // The note is shown again at the top of the rep's brief.
  await panel.getByRole('button').first().click()
  await expect(page).toHaveURL(new RegExp(`#/practice/${choice}$`))
  await expect(page.locator('.rep-planned-note blockquote')).toHaveText('Start with the empty case.')

  // Choosing something else clears the plan.
  await page.goto('/#/home')
  await page.locator('.planned-panel').getByRole('button', { name: 'Choose something else' }).click()
  await expect(page.locator('.planned-panel')).toHaveCount(0)
  await expect(page.locator('#continue-heading')).toBeVisible()
})

test('a longer rep can stop after its plan, and waits on Trail as next time’s rep', async ({ page }) => {
  await page.goto('/#/practice/await-local-records')
  const steps = page.getByRole('navigation', { name: 'Practice steps' })
  await steps.getByRole('button', { name: 'Plan', exact: true }).click()
  const pause = page.getByRole('button', { name: 'Stop here and solve it next time' })
  await expect(pause).toHaveCount(0)
  await page.getByLabel('Your plan', { exact: true }).fill('Walk two pointers inward from both ends.')
  await pause.click()
  await expect(page).toHaveURL(/#\/home$/)
  await expect(page.locator('.day-closed .next-time')).toContainText('is waiting on Trail.')
  await page.locator('.day-closed').getByRole('button', { name: "Show today's plan" }).click()
  await expect(page.locator('.planned-panel')).toContainText('Your draft is saved where you left it.')
  await expect(page.locator('.planned-panel')).toContainText('Continue')
})

test('Progress counts this week against a target the learner chooses', async ({ page }) => {
  await seed(page, [record('declare-variables', 0)])
  await page.goto('/#/progress')
  const stat = page.locator('.rhythm-stat').filter({ hasText: 'Days this week' })
  await expect(stat.locator('b')).toHaveText('1 of 3')
  await chooseOption(page.getByRole('combobox', { name: 'Weekly target' }), { label: '1 day a week' })
  await expect(stat.locator('b')).toHaveText('1 of 1')
  await expect(stat).toContainText('Target met this week')
  await page.reload()
  await expect(page.locator('.rhythm-stat').filter({ hasText: 'Days this week' }).locator('b')).toHaveText('1 of 1')
})

test('before anything today, Trail offers the smallest day that still counts', async ({ page }) => {
  // Nothing is due yet, so the next-practice panel asks for a new rep; finished reps make a short one available.
  await seed(page, [record('declare-variables', 2), record('count-even-numbers', 1)])
  const one = page.locator('.today-one')
  await expect(one).toContainText('Short on time?')
  await one.getByRole('button', { name: /^Just one/ }).click()
  await expect(page).toHaveURL(/#\/practice\/[a-z0-9-]+$/)
})
