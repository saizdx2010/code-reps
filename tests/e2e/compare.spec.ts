import { expect, test } from '@playwright/test'
import { chooseSegment, expectChecksFinished, replaceCode, route, solution } from './helpers'

async function solveAndExplain(page: import('@playwright/test').Page, plan: string, explanation: string) {
  await page.getByRole('button', { name: 'Plan', exact: true }).first().click()
  await page.getByLabel('Your plan', { exact: true }).fill(plan)
  await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
  await replaceCode(page, solution)
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).first().click()
  await page.getByLabel('Your explanation', { exact: true }).fill(explanation)
}

test('a second finish reads back the earlier plan and explanation beside today’s', async ({ page }) => {
  await page.goto(route)
  await solveAndExplain(page, 'Count with a map first.', 'A map counts each number once.')
  await page.getByRole('button', { name: 'Review', exact: true }).first().click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.getByText('Your attempt is saved in the Journal.', { exact: true })).toBeVisible()
  await expect(page.getByText('Read back your earlier explanation')).toHaveCount(0)

  await page.getByRole('button', { name: 'Start a fresh attempt', exact: true }).click()
  await solveAndExplain(page, 'Track counts, then break ties by the smaller value.', 'Ties go to the smaller number.')
  await page.getByRole('button', { name: 'Review', exact: true }).first().click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await page.getByText('Read back your earlier explanation').click()
  const pair = page.locator('.earlier-work-pair').first()
  await expect(pair).toContainText('Your earlier attempt')
  await expect(pair).toContainText('Explanation: A map counts each number once.')
  await expect(pair).toContainText('Explanation: Ties go to the smaller number.')
})
