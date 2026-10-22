import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'

// Reference solutions from tests/fixtures/core-solutions.mjs.
const coreSolutions: Record<string, string> = {
  'count-above-threshold': 'function countAbove(numbers: number[], limit: number) { return numbers.filter(n => n > limit).length }',
}

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
const steps = (page: Page) => page.getByRole('navigation', { name: 'Practice steps' })

/** Solves the open rep from its reference solution, writes what its Finish step asks for, and completes it. */
async function complete(page: Page, repId: string) {
  await steps(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Work through the input once and return the answer.')
  await steps(page).getByRole('button', { name: 'Solve', exact: true }).click()
  await replaceCode(page, coreSolutions[repId], repId)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await steps(page).getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByLabel('Your explanation', { exact: true }).fill('It returns the answer the contract asks for, in one pass.')
  await steps(page).getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  return page.locator('.completion-panel')
}

test('Start set runs Today’s reviews first, then the new rep, each leading to the next', async ({ page }) => {
  // Arrays' recall and a hinted review are due; Today also picks one new rep.
  await seed(page, [record('sum-positive-numbers', 9, 1), record('count-even-numbers', 8), record('declare-variables', 4, 1)])
  const plan = page.locator('.today-plan')
  await plan.getByRole('button', { name: 'Start set' }).click()
  await expect(page).toHaveURL(/#\/practice\/count-above-threshold$/)
  const set = await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:today-set'))
  expect(set).toMatch(/^r:count-above-threshold,r:declare-variables,n:[a-z-]+$/)
  await expect(page.locator('.workspace-header')).toContainText('Set · 1 of 3')

  const panel = await complete(page, 'count-above-threshold')
  await panel.getByRole('button', { name: 'Next in set: Declare a value' }).click()
  await expect(page).toHaveURL(/#\/practice\/declare-variables$/)
  await expect(page.locator('.workspace-header')).toContainText('Set · 2 of 3')

  // Opening a rep another way ends the set.
  await page.goto('/#/practice')
  await page.getByRole('searchbox').first().fill('Count words')
  await page
    .getByRole('button', { name: /^Count words/ })
    .first()
    .click()
  await expect(page).toHaveURL(/#\/practice\/count-words$/)
  await expect(page.locator('.workspace-header')).not.toContainText('Set ·')
  expect(await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:today-set'))).toBe('')
})

test('Home shows the quick warm-up inside the Today column, as before', async ({ page }) => {
  await page.goto('/#/home')
  await page.evaluate(
    value => {
      localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(value))
    },
    [record('make-arrays', 9), record('sum-positive-numbers', 6), record('count-words', 4)],
  )
  await page.reload()
  await expect(page.getByRole('region', { name: 'Quick warm-up' })).toContainText('3 short reps you finished before')
})

test('a set whose main rep has a trace ends with a cool-down: the trace in predict mode', async ({ page }) => {
  await page.goto('/#/home')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:default:today-set', 'n:algo-climb-stairs'))
  await page.goto('/#/practice/algo-climb-stairs')
  await page.reload()
  await expect(page.locator('.workspace-header')).toContainText('Set · 1 of 1')
  coreSolutions['algo-climb-stairs'] =
    'function climbStairs(n: number): number { const ways = [1, 1]; for (let i = 2; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2]; return ways[n] }'
  const panel = await complete(page, 'algo-climb-stairs')
  await panel.getByRole('button', { name: 'Cool-down: call the steps of the trace' }).click()
  const run = page.locator('.see-it-run')
  await expect(run.getByRole('heading', { name: 'Cool-down: see it run' })).toBeVisible()
  await expect(run.getByRole('button', { name: 'Stop predicting', exact: true })).toBeVisible()
  await expect(run).toBeInViewport()
  expect(await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:today-set'))).toBe('')
})

test('the last rep of a set without a trace finishes the set back on Trail', async ({ page }) => {
  await page.goto('/#/home')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:default:today-set', 'r:count-above-threshold'))
  await page.goto('/#/practice/count-above-threshold')
  await page.reload()
  const panel = await complete(page, 'count-above-threshold')
  await panel.getByRole('button', { name: 'Finish set' }).click()
  await expect(page).toHaveURL(/#\/home$/)
  expect(await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:today-set'))).toBe('')
})
