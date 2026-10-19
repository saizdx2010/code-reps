import { expect, test } from '@playwright/test'
import { devopsSolutions } from '../fixtures/devops-solutions.mjs'
import { expectChecksFinished, replaceCode } from './helpers'

const tracks = ['Problem solving', 'Pattern Recognition', 'Frontend', 'SQL', 'Backend', 'DevOps']

test('DevOps is the last track card, builds on Backend, and opens its trail', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#/paths')
  // The picker starts open on wide screens.
  await expect(page.locator('.path-picker')).toHaveAttribute('open', '')
  const cards = page.locator('.track-group .path-choices > button')
  await expect(cards.locator('strong')).toHaveText(tracks)
  const devops = cards.filter({ has: page.locator('strong', { hasText: /^DevOps$/ }) })
  await expect(devops).toContainText('Read CI output, ship with rollouts and health checks, and keep a service observable.')
  await expect(devops.locator('small')).toContainText('· Builds on Backend')
  // Six cards fill the three-column grid: DevOps sits beside Backend on the second row.
  const backendBox = (await cards.nth(4).boundingBox())!
  const devopsBox = (await devops.boundingBox())!
  expect(Math.abs(devopsBox.y - backendBox.y)).toBeLessThan(2)
  expect(devopsBox.x).toBeGreaterThan(backendBox.x)
  await devops.click()
  await expect(page.locator('#path-title')).toHaveText('DevOps')
  await expect(page.locator('.path-overview .home-label')).toHaveText('Builds on Backend')
  await expect(page.locator('.path-stage').first()).toContainText('Read CI output')
  await expect(page.getByRole('button', { name: /Read an exit code/ })).toBeVisible()
  await page.reload()
  await expect(page.locator('#path-title')).toHaveText('DevOps')
})

test('DevOps can be chosen at a phone width without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/paths')
  await page.locator('.path-picker > summary').click()
  await page
    .locator('.path-choices')
    .getByRole('button', { name: /^DevOps/ })
    .click()
  await expect(page.locator('#path-title')).toHaveText('DevOps')
  await expect(page.locator('#path-title')).toBeFocused()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a DevOps rep runs its checks in the worker and says what they do not establish', async ({ page }) => {
  await page.goto('/#/practice/devops-exit-meaning')
  await expect(page.getByRole('heading', { name: 'Read an exit code', exact: true })).toBeVisible()
  const checking = page.locator('.info-note').filter({ hasText: 'How this is checked' }).first()
  await checking.locator('summary').click()
  await expect(checking).toContainText('they do not run a shell, Docker, a CI service, or a real network')
  await replaceCode(page, devopsSolutions['devops-exit-meaning'], 'devops-exit-meaning')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})

// Time zone answers come from the engine's own rules; this confirms Chromium agrees with the Node references.
for (const repId of ['devops-local-to-utc', 'devops-cron-next-zone']) {
  test(`${repId} passes in Chromium's worker with the reference solution`, async ({ page }) => {
    await page.goto(`/#/practice/${repId}`)
    await replaceCode(page, devopsSolutions[repId], repId)
    await page.keyboard.press('ControlOrMeta+Enter')
    await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  })
}
