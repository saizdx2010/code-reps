import { expect, test } from '@playwright/test'
import { editor, expectChecksFinished, replaceCode, route, solution } from './helpers'

const tieBug = solution.replace(' || (count === counts.get(best)! && number < best)', '')
const tie = 'Chooses the smaller number on a tie'

test('before the first run, one optional call: will every check pass?', async ({ page }) => {
  await page.goto(route)
  const checks = page.locator('#checks-section')
  await checks.getByRole('button', { name: /^Checks/ }).click()
  const call = checks.getByRole('group', { name: 'Your call: will every check pass?' })
  // No check names before a run: the call reveals nothing about the cases.
  await expect(checks.locator('.result-list')).toHaveCount(0)
  await call.getByRole('button', { name: 'No, some will fail' }).click()
  await expect(call.getByRole('button', { name: 'No, some will fail' })).toHaveAttribute('aria-pressed', 'true')
  await replaceCode(page, tieBug)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('5 of 6 checks passed', { exact: true }))
  await expect(checks.locator('.call-verdict')).toHaveText('You said some checks would fail: called it.')
  // The call is judged once; the next run starts without one.
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('5 of 6 checks passed', { exact: true }))
  await expect(checks.locator('.call-verdict')).toHaveCount(0)
})

test('after an edit, calls beside each check name are judged against the next run, surprises first', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, tieBug)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('5 of 6 checks passed', { exact: true }))
  await replaceCode(page, solution)
  const checks = page.locator('#checks-section')
  await expect(checks.getByRole('button', { name: /^Checks/ })).toContainText('Out of date')
  await checks
    .getByRole('group', { name: `Your call for “${tie}” next run` })
    .getByRole('button', { name: 'Fail' })
    .click()
  await checks.getByRole('group', { name: 'Your call for “Counts the example” next run' }).getByRole('button', { name: 'Pass' }).click()
  await expect(checks.getByRole('button', { name: 'Clear calls' })).toBeVisible()
  await editor(page).focus()
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await expect(checks.locator('.call-verdict')).toHaveText('You called 1 of 2 correctly. 1 surprise: look at it first.')
  const rows = checks.locator('.result-list > li')
  await expect(rows.first()).toContainText(tie)
  await expect(rows.first()).toContainText('Surprise · you said fail')
  await expect(checks.locator('li', { hasText: 'Counts the example' })).toContainText('Called it')
})

test('in a table trace, a tap on the next cell is checked when the step is revealed', async ({ page }) => {
  await page.goto('/#/practice/algo-climb-stairs')
  await replaceCode(
    page,
    'function climbStairs(n: number): number { const ways = [1, 1]; for (let i = 2; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2]; return ways[n] }',
    'algo-climb-stairs',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare with a model answer', { exact: true }).click()
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await viewer.getByRole('button', { name: 'Predict each step', exact: true }).click()
  const pick = viewer.getByRole('group', { name: 'Which cell fills next?' })
  // Walk forward until a hidden step offers a pick.
  for (let step = 0; step < 4 && !(await pick.isVisible()); step++) {
    await viewer.getByRole('button', { name: /^(Next|Reveal step)$/ }).click()
  }
  await expect(pick).toBeVisible()
  await pick.getByRole('button', { name: 'ways[2], empty' }).click()
  await expect(pick.getByRole('button', { name: 'ways[2], empty' })).toHaveAttribute('aria-pressed', 'true')
  await viewer.getByRole('button', { name: 'Reveal step', exact: true }).click()
  await expect(viewer.locator('.trace-pick-verdict')).toHaveText('You called it: ways[2] fills next.')
  await expect(viewer.getByRole('status')).toContainText('You called 1 of 1 next steps in the drawing.')
})
