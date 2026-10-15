import { expect, test } from '@playwright/test'
import { editor, expectChecksFinished, replaceCode, route, solution } from './helpers'

const tieBug = solution.replace(' || (count === counts.get(best)! && number < best)', '')
const steps = (page: import('@playwright/test').Page) => page.getByRole('navigation', { name: 'Practice steps' })

test('an edit keeps the failing case as an out-of-date reference that never counts as a pass', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, tieBug)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('5 of 6 checks passed', { exact: true }))
  await editor(page).focus()
  await page.keyboard.press('End')
  await page.keyboard.type(' ')
  const checks = page.locator('#checks-section')
  await expect(checks.getByRole('button', { name: /^Checks/ })).toContainText('Out of date')
  await expect(checks.getByRole('button', { name: /^Checks/ })).toContainText('Last run: 5 of 6 passed')
  await expect(checks).not.toContainText('Not run yet')
  // The diagnostic is still readable while the learner fixes it.
  await expect(checks).toContainText('mostFrequent([9,2,9,2])')
  await expect(checks.getByText('Actual (last run)')).toBeVisible()
  await expect(page.locator('.workspace-toolbar')).toContainText('Run again to check your edit')
  // Stale results never mark Solve done or offer Explain.
  await expect(steps(page).getByRole('button', { name: 'Solve', exact: true })).toContainText('Needed')
  await expect(checks.getByRole('button', { name: /Explain your solution/ })).toHaveCount(0)
  await replaceCode(page, solution)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await expect(checks).not.toContainText('Out of date')
  await expect(checks.getByRole('button', { name: /Explain your solution/ })).toBeVisible()
})

test('the first hint on an independent rep asks once and keeps focus in place', async ({ page }) => {
  await page.goto(route)
  await expect(page.locator('.workspace-title')).toContainText('Independent')
  await page.getByRole('button', { name: 'Reveal hint 1', exact: true }).click()
  const ask = page.getByRole('group', { name: 'Reveal hint 1?' })
  await expect(ask).toContainText('counts as guided practice')
  await expect(ask.getByRole('button', { name: 'Keep trying' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(ask).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reveal hint 1', exact: true })).toBeFocused()
  await expect(page.locator('.task-hints')).toHaveCount(0)
  await page.getByRole('button', { name: 'Reveal hint 1', exact: true }).click()
  await ask.getByRole('button', { name: 'Reveal hint', exact: true }).click()
  await expect(page.locator('.task-hints')).toBeVisible()
  // Only the first hint asks.
  await page.getByRole('button', { name: 'Reveal hint 2', exact: true }).click()
  await expect(page.locator('.task-hints li')).toHaveCount(2)
})

test('a guided or ungrouped rep reveals hints in one click', async ({ page }) => {
  await page.goto('/#/practice/declare-variables')
  await page.getByRole('button', { name: 'Reveal hint 1', exact: true }).click()
  await expect(page.locator('.task-hints')).toBeVisible()
  await expect(page.getByRole('group', { name: 'Reveal hint 1?' })).toHaveCount(0)
})

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`Finish puts requirements first and the reward in view at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto(route)
    await steps(page).getByRole('button', { name: 'Finish', exact: true }).click()
    await expect(steps(page).getByRole('button', { name: 'Finish', exact: true })).toContainText('To do')
    await expect(page.locator('#finish-note')).toHaveText(/Still needed: a plan\./)
    await page.getByRole('button', { name: 'Go to Plan' }).click()
    await page.getByLabel('Your plan', { exact: true }).fill('Count each value, then keep the highest count and the smaller value on ties.')
    await steps(page).getByRole('button', { name: 'Solve', exact: true }).click()
    await replaceCode(page, solution)
    await page.keyboard.press('ControlOrMeta+Enter')
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
    await steps(page).getByRole('button', { name: 'Explain', exact: true }).click()
    await page
      .getByLabel('Your explanation', { exact: true })
      .fill('I count values in a map and keep the best, breaking ties toward the smaller value.')
    await steps(page).getByRole('button', { name: 'Finish', exact: true }).click()
    await expect(steps(page).getByRole('button', { name: 'Finish', exact: true })).toContainText('Ready')
    await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
    const panel = page.locator('.completion-panel')
    await expect(panel).toBeFocused()
    await expect(panel.locator('.completion-evidence')).toContainText('No hints')
    const next = panel.getByRole('button', { name: /^Next rep/ })
    await expect(next).toBeInViewport()
    // Reflection stays below the reward, and mistake tags become a read-only record.
    await expect(page.locator('.mistake-tags.is-recorded')).toHaveText('None noted for this attempt.')
    await expect(steps(page).getByRole('button', { name: 'Finish', exact: true })).toContainText('Done')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('after passing, the reference trace leads Explain without opening the model answer', async ({ page }) => {
  await page.goto('/#/practice/algo-sorted-pair')
  await steps(page).getByRole('button', { name: 'Explain', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'See it run' })).toHaveCount(0)
  await replaceCode(
    page,
    'function hasSortedPair(numbers: number[], target: number): boolean { let left = 0, right = numbers.length - 1; while (left < right) { const sum = numbers[left] + numbers[right]; if (sum === target) return true; if (sum < target) left++; else right-- } return false }',
    'algo-sorted-pair',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await steps(page).getByRole('button', { name: 'Explain', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'See it run' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Step trace' })).toBeVisible()
  await expect(page.locator('.reflection-guide')).not.toHaveAttribute('open', '')
})
