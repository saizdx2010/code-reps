import { expect, test } from '@playwright/test'

const repId = 'sum-positive-numbers'
const sessionKey = 'code-reps:profile:default:sessions:v1'

test('practice sessions are not offered in the workspace, Home, or Journal', async ({ page }) => {
  await page.goto(`/#/practice/${repId}`)
  await expect(page.getByRole('button', { name: 'Record a session' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reflect and end session' })).toHaveCount(0)
  await page.goto('/#/home')
  await expect(page.getByText('Unfinished sessions')).toHaveCount(0)
  await page.goto('/#/history')
  await expect(page.getByRole('group', { name: 'Journal' }).getByRole('button', { name: 'Practice sessions' })).toHaveCount(0)
  expect(await page.evaluate(key => localStorage.getItem(key), sessionKey)).toBeNull()
})

test('a bookmarked sessions route opens the Journal', async ({ page }) => {
  await page.goto('/#/sessions')
  await expect(page).toHaveURL(/#\/history$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Attempt history' })).toBeVisible()
})
