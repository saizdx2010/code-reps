import { expect, test } from '@playwright/test'

test('Home offers a warm-up of earlier Beginner reps that starts the first one fresh', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { name: 'Quick warm-up' })).toHaveCount(0)
  // Only this test's fresh browser context receives sample completion history.
  await page.evaluate(() => {
    const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()
    const base = { plan: 'Recorded plan', code: 'Recorded code', explanation: 'Recorded explanation', hintCount: 0 }
    const history = [
      { ...base, id: 'w1', repId: 'make-arrays', completedAt: ago(9) },
      { ...base, id: 'w2', repId: 'sum-positive-numbers', completedAt: ago(6) },
      { ...base, id: 'w3', repId: 'count-words', completedAt: ago(4) },
    ]
    localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(history))
  })
  await page.reload()
  const panel = page.getByRole('region', { name: 'Quick warm-up' })
  await expect(panel).toContainText('3 short reps you finished before')
  await expect(panel.locator('p')).toHaveAttribute('title', /Read an array.*Sum positive numbers.*Count words/)
  await panel.getByRole('button', { name: 'Start warm-up', exact: true }).click()
  await expect(page).toHaveURL(/#\/practice\/make-arrays$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:warmup'))).toBe(
    'make-arrays,sum-positive-numbers,count-words',
  )
  // Opening a rep any other way ends the warm-up, so its completion button never names a warm-up step.
  await page.goto('/#/practice')
  await page.getByRole('searchbox').first().fill('Count words')
  await page
    .getByRole('button', { name: /^Count words/ })
    .first()
    .click()
  await expect(page).toHaveURL(/#\/practice\/count-words$/)
  expect(await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:warmup'))).toBe('')
})
