import { expect, test } from '@playwright/test'
import { chooseSegment, expectChecksFinished, replaceCode, route, solution } from './helpers'

async function solveAndExplain(page: import('@playwright/test').Page, plan: string, explanation: string, code = solution) {
  await page.getByRole('button', { name: 'Plan', exact: true }).first().click()
  await page.getByLabel('Your plan', { exact: true }).fill(plan)
  await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
  await replaceCode(page, code)
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).first().click()
  await page.getByLabel('Your explanation', { exact: true }).fill(explanation)
}

async function finishTwice(page: import('@playwright/test').Page, secondCode = solution) {
  await page.goto(route)
  await solveAndExplain(page, 'Count with a map first.', 'A map counts each number once.')
  await page.getByRole('button', { name: 'Finish', exact: true }).first().click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
  await expect(page.locator('.then-now')).toHaveCount(0)

  await page.getByRole('button', { name: 'Start a fresh attempt', exact: true }).click()
  await solveAndExplain(page, 'Track counts, then break ties by the smaller value.', 'Ties go to the smaller number.', secondCode)
  await page.getByRole('button', { name: 'Finish', exact: true }).first().click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  return page.locator('.then-now')
}

// The same behaviour written differently, so a changed line appears on each side.
const rewritten = solution.replace('return best', 'const answer = best\n  return answer')

test('a second finish puts the first attempt beside today’s: code, hints, and writing', async ({ page }) => {
  const panel = await finishTwice(page, rewritten)
  await expect(panel).toHaveAttribute('open', '')
  await expect(panel.locator('summary')).toContainText('Then and now')
  await expect(panel.locator('summary')).toContainText('Same rep, earlier today')
  // The task column is narrower than two code columns need, so the panel switches between versions, today first.
  const toggle = panel.getByRole('group', { name: 'Show version' })
  await expect(panel.locator('.then-now-now')).toContainText('Explanation: Ties go to the smaller number.')
  await expect(panel.locator('.then-now-now .is-changed')).toHaveCount(2)
  await expect(panel.locator('.then-now-now .is-changed').first()).toContainText('Changed:')
  await toggle.getByRole('button').nth(1).click()
  const then = panel.locator('.then-now-then')
  await expect(then).toContainText('first attempt')
  await expect(then).toContainText('Explanation: A map counts each number once.')
  await expect(then.getByText('No hints')).toBeVisible()
  await expect(then.locator('.is-changed')).toHaveCount(1)
  await panel.locator('summary').click()
  await expect(panel).not.toHaveAttribute('open', '')
})

test('on a phone, Then and now switches between today and the first attempt', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const panel = await finishTwice(page)
  const toggle = panel.getByRole('group', { name: 'Show version' })
  await expect(toggle).toBeVisible()
  await expect(panel.locator('.then-now-now')).toBeVisible()
  await expect(panel.locator('.then-now-then')).toBeHidden()
  await toggle.getByRole('button').nth(1).click()
  await expect(panel.locator('.then-now-then')).toBeVisible()
  await expect(panel.locator('.then-now-now')).toBeHidden()
  await expect(toggle.getByRole('button').nth(1)).toHaveAttribute('aria-pressed', 'true')
})
