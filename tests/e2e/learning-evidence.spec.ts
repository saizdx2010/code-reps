import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseSegment, expectChecksFinished, replaceCode, route, solution } from './helpers'

const day = 86_400_000
/** Noon on the local calendar day a given number of days ago, so records land on their intended day; never in the future. */
const ago = (days: number) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  return new Date(Math.min(date.getTime() - days * day, Date.now() - 60_000)).toISOString()
}
const record = (repId: string, daysAgo: number, hintCount = 0, id = `${repId}-${daysAgo}`) => ({
  id,
  repId,
  completedAt: ago(daysAgo),
  plan: 'plan',
  code: 'code',
  explanation: 'explanation',
  hintCount,
  confidence: 'getting-there',
  difficulty: 'none',
})

async function seed(page: Page, history: ReturnType<typeof record>[]) {
  // Only this test's fresh browser context receives the sample history, with each completed draft saved as it would be.
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

test('a hint-free independent rep moves its skill up, notes the personal best, and the skill map replays it once', async ({ page }) => {
  await seed(page, [record('has-duplicate', 1, 2)])
  await page.goto(route)
  const steps = page.getByRole('navigation', { name: 'Practice steps' })
  await steps.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Count occurrences and choose the smaller number when counts tie.')
  await steps.getByRole('button', { name: 'Solve', exact: true }).click()
  await replaceCode(page, solution)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await steps.getByRole('button', { name: 'Explain', exact: true }).click()
  await page
    .getByLabel('Your explanation', { exact: true })
    .fill('I count each value, compare counts, and use the smaller value to break ties. Empty input returns null.')
  await steps.getByRole('button', { name: 'Finish', exact: true }).click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()

  const notice = page.locator('.skill-step-notice')
  await expect(notice).toContainText('Skill moved up')
  await expect(notice.locator('li')).toHaveText(/^Count and remember\s*Guided\s*to\s*Independent$/)
  await expect(page.locator('.personal-best')).toHaveText('Personal best: no hints this time. Last time on this skill you used 2 hints.')

  await notice.getByRole('button', { name: 'See skill map' }).click()
  await expect(page).toHaveURL(/#\/skillmap$/)
  const stepped = page.locator('.skill-node[data-stepped]')
  await expect(stepped).toHaveCount(1)
  await expect(stepped).toContainText('Count and remember')
  await expect(stepped).toHaveAttribute('data-step', 'play')
  await expect(page.locator('.skill-map-main [role="status"]').first()).toHaveText('Count and remember moved up to Independent.')
  await expect(stepped).toBeInViewport()

  // Each step plays once: coming back to the map, or reopening the finished rep, does not queue it again.
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Skill map' })).toBeVisible()
  await expect(page.locator('.skill-node[data-stepped]')).toHaveCount(0)
  await page.goto(route)
  await expect(page.locator('.skill-step-notice')).toContainText('Count and remember')
  await page.goto('/#/skillmap')
  await expect(page.getByRole('heading', { level: 1, name: 'Skill map' })).toBeVisible()
  await expect(page.locator('.skill-node[data-stepped]')).toHaveCount(0)
})

test("Trail's Today plan lists the new rep and due reviews, then says when today's practice is done", async ({ page }) => {
  // Arrays: guided and independent long ago, so its recall is due. A hinted rep from four days ago is due for review.
  const history = [record('sum-positive-numbers', 9, 1), record('count-even-numbers', 8), record('declare-variables', 4, 1)]
  await seed(page, history)
  const plan = page.locator('.today-plan')
  await expect(plan.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible()
  await expect(plan.locator('.today-plan-count')).toHaveText('0 of 3 done')
  const rows = plan.locator('.list-row')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText('New rep')
  await expect(rows.nth(0).locator('.status-chip')).toHaveText('New')
  await expect(rows.nth(1)).toContainText('Count values above a limit')
  // The review the panel above recommends says so, rather than repeating its due state.
  await expect(rows.nth(1).locator('.status-chip')).toHaveText('Up next')
  await expect(rows.nth(2)).toContainText('Declare a value')
  await rows.nth(1).getByRole('button').click()
  await expect(page).toHaveURL(/#\/practice\/count-above-threshold$/)

  // Finishing all three today, recorded as attempts completed today, completes the plan. Nothing is locked.
  await seed(page, [
    ...history,
    record('count-above-threshold', 0, 0, 'recall-today'),
    record('declare-variables', 0, 0, 'review-today'),
    record('create-objects', 0, 0, 'new-today'),
  ])
  await expect(plan.locator('.today-plan-count')).toHaveText('3 of 3 done')
  await expect(plan.locator('.status-chip')).toHaveText(['Done', 'Done', 'Done'])
  await expect(plan.locator('.today-done')).toContainText("Today's practice is done.")
  await expect(page.locator('#continue-heading')).toBeVisible()
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('with nothing due and nothing done, Trail shows no plan that would only repeat the next-practice panel', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.locator('.today-plan')).toHaveCount(0)
})

test('evidence badges are listed before completion badges, drawn as square desk tiles that follow the colour scheme', async ({ page }) => {
  await seed(page, [record('sum-positive-numbers', 9, 1), record('count-even-numbers', 8)])
  await page.goto('/#/progress')
  await expect(page.locator('.badge-group-title')).toHaveText(['Evidence · 1', 'Completion · 1'])
  const card = page.getByRole('list', { name: 'Earned evidence badges' }).locator('.badge-card')
  await expect(card).toHaveCount(1)
  await expect(card.locator('strong')).toHaveText('First independent skill')
  await expect(card.locator('.badge-detail')).toHaveText(
    'Work through arrays: Count even numbers solved without hints after the guided rep.',
  )
  await expect(card.locator('.badge-art')).toHaveAttribute('data-shape', 'square')
  await expect(card.locator('.badge-art')).toHaveAttribute('aria-hidden', 'true')
  // The tile is the coding desk: it stays dark in light mode, and follows the selected scheme.
  const lit = () =>
    card
      .locator('.badge-rung-lit')
      .first()
      .evaluate(element => getComputedStyle(element).stroke)
  expect(await lit()).toBe('rgb(188, 229, 123)')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:device:palette', 'ocean'))
  await page.reload()
  await expect(card.locator('.badge-art')).toBeVisible()
  expect(await lit()).toBe('rgb(151, 217, 245)')
  await page.setViewportSize({ width: 390, height: 900 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
