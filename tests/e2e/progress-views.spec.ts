import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const day = 86_400_000
const ago = (days: number, now = Date.now()) => {
  const date = new Date(now)
  date.setHours(12, 0, 0, 0)
  return new Date(Math.min(date.getTime() - days * day, now - 60_000)).toISOString()
}
const record = (repId: string, daysAgo: number, hintCount = 0, now?: number) => ({
  id: `${repId}-${daysAgo}`,
  repId,
  completedAt: ago(daysAgo, now),
  plan: `My plan for ${repId}.`,
  code: 'code',
  explanation: 'explanation',
  hintCount,
})
async function seed(page: Page, history: ReturnType<typeof record>[], session: Record<string, string> = {}) {
  await page.goto('/#/home')
  await page.evaluate(
    ([value, ui]) => {
      localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(value))
      for (const item of [...value].reverse()) {
        const { id: _id, repId, ...attempt } = item
        localStorage.setItem(`code-reps:profile:default:attempt:${repId}:v1`, JSON.stringify(attempt))
      }
      for (const [key, text] of Object.entries(ui)) sessionStorage.setItem(`code-reps:ui:default:${key}`, text)
    },
    [history, session] as const,
  )
  await page.reload()
}

test('Trail draws the walked line, marks where you are, and names what is left in the stage', async ({ page }) => {
  await seed(page, [record('declare-variables', 0), record('basic-types', 0)], { 'trail-done-seen': 'seen declare-variables' })
  await expect(page.getByRole('heading', { level: 1 }).locator('..')).toContainText('this month')
  const stage = page.locator('.trail-stage').first()
  await expect(stage.locator('.trail-left')).toHaveText(/left$/)
  await expect(stage.locator('.trail-here')).toHaveText('You are here')
  await expect(stage.locator('[data-walk-up="recent"]')).toHaveCount(1)
  // The rep finished since the trail last showed it plays its check once.
  await expect(page.locator('#trail-basic-types').locator('..')).toHaveClass(/is-fresh/)
  await expect(page.locator('#trail-declare-variables').locator('..')).not.toHaveClass(/is-fresh/)
  await page.reload()
  await expect(page.locator('#trail-basic-types').locator('..')).not.toHaveClass(/is-fresh/)
})

test('the skill map shows fading skills, then and now, a recall countdown, and replays past weeks', async ({ page }) => {
  // Which attempts share the oldest week depends on the weekday. On a Thursday, the guided rep 40 days back (a Saturday)
  // sits alone in the oldest week and the independent one 38 days back starts the next, so the browser's clock is fixed.
  const now = new Date('2026-10-29T15:00:00').getTime()
  await page.clock.setFixedTime(now)
  await seed(page, [
    record('sum-positive-numbers', 40, 2, now),
    record('count-even-numbers', 38, 0, now),
    record('count-above-threshold', 33, 0, now),
    record('count-words', 2, 1, now),
    record('first-word-ending', 1, 0, now),
  ])
  await page.goto('/#/skillmap')
  const arrays = page.locator('.skill-node').filter({ hasText: 'Work through arrays' })
  await expect(arrays).toHaveClass(/is-fading/)
  await expect(arrays).toContainText(/Fading: last held 33 days ago/)
  await expect(arrays.getByRole('button', { name: /^Fresh review: / })).toBeVisible()
  await arrays.locator('.skill-then-now > summary').click()
  await expect(arrays.locator('.skill-then-now-sides')).toContainText('My plan for sum-positive-numbers.')
  await expect(arrays.locator('.skill-then-now-gap')).toHaveText('7 days from your first guided rep to the recall that held.')

  const slider = page.getByRole('slider', { name: 'Week shown' })
  await expect(page.locator('.skill-timeline output')).toHaveText('Today')
  await slider.fill('0')
  await expect(page.locator('.skill-timeline output')).toHaveText(/^Week of /)
  await expect(arrays.locator('.status-chip').first()).toHaveText('Guided')
  await page.getByRole('button', { name: 'Back to today' }).click()
  await expect(arrays.locator('.status-chip').first()).toHaveText('Retained')
})

test('the Library marks finished reps as a collection with their best evidence', async ({ page }) => {
  await seed(page, [record('declare-variables', 3, 2), record('declare-variables', 1), record('basic-types', 2, 1)])
  await page.goto('/#/practice')
  await page.getByRole('searchbox').first().fill('Declare a value')
  const row = page.locator('.list-row').filter({ hasText: 'Declare a value' }).first()
  await expect(row).toContainText('Best: no hints')
  await expect(row.locator('.collection-mark')).toHaveAttribute('data-done', 'true')
})

test('the plan page looks back at the last 30 days', async ({ page }) => {
  await seed(page, [
    record('declare-variables', 40, 2),
    record('sum-positive-numbers', 20, 2),
    record('count-even-numbers', 18),
    record('declare-variables', 5),
  ])
  await page.goto('/#/plan')
  const month = page.locator('.month-review')
  await expect(month).toContainText('Skills that moved up')
  await expect(month).toContainText('Work through arrays · Independent')
  await expect(month).toContainText('Now without hints')
  await month.getByLabel('What are you proudest of this month?').fill('Solving arrays without hints.')
  await month.getByRole('button', { name: 'Save to Notebook' }).click()
  await expect(month.getByRole('status')).toHaveText('Saved to your Notebook.')
})
