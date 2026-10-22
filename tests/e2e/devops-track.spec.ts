import { expect, test } from '@playwright/test'
import { devopsSolutions } from '../fixtures/devops-solutions.mjs'
import { chooseTrack, expectChecksFinished, replaceCode } from './helpers'

const tracks = ['Problem solving', 'Pattern Recognition', 'Frontend', 'SQL', 'Backend', 'DevOps']

test('DevOps is the last track card, builds on Backend, and opens its trail', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#/paths')
  // Every track card is in view on a wide screen; there is no menu to open.
  await expect(page.getByRole('combobox', { name: 'Choose track', exact: true })).toBeHidden()
  const cards = page.locator('.track-group .path-choices > button')
  await expect(cards.locator('strong')).toHaveText(tracks)
  const devops = cards.filter({ has: page.locator('strong', { hasText: /^DevOps$/ }) })
  await expect(devops).toContainText('Read CI output, ship with rollouts and health checks, and keep a service observable.')
  await expect(devops.locator('small')).toContainText('· Builds on Backend')
  // Six cards fill the three-column grid: DevOps sits beside Backend on the second row. Measure after the cards' arrival motion.
  await cards.evaluateAll(elements =>
    Promise.all(elements.flatMap(element => element.getAnimations()).map(animation => animation.finished)),
  )
  const backendBox = (await cards.nth(4).boundingBox())!
  const devopsBox = (await devops.boundingBox())!
  expect(Math.abs(devopsBox.y - backendBox.y)).toBeLessThan(2)
  expect(devopsBox.x).toBeGreaterThan(backendBox.x)
  await devops.click()
  await expect(page.locator('#path-title')).toHaveText('DevOps')
  await expect(page.locator('.path-stage').first()).toContainText('Read CI output')
  await expect(page.getByRole('button', { name: /Read an exit code/ })).toBeVisible()
  await page.reload()
  await expect(page.locator('#path-title')).toHaveText('DevOps')
})

test('the DevOps trail ends with its own-machine project, which opens expanded in Projects', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#/paths')
  await page
    .locator('.path-choices')
    .getByRole('button', { name: /^DevOps/ })
    .click()
  const last = page.locator('.trail-stage').last()
  await expect(last.locator('h3')).toHaveText('Apply this track in a project')
  await expect(last.locator('.trail-stage-count')).toHaveText('Self-review')
  await expect(last).toContainText('Containerize an app and add CI on your own machine')
  await expect(last).toContainText('External project · Self-review')
  await last.getByRole('button', { name: 'Open project brief' }).click()
  await expect(page).toHaveURL(/#\/projects$/)
  const project = page.locator('#project-devops-container-ci')
  const summary = page.locator('#project-devops-container-ci > summary')
  await expect(project).toHaveAttribute('open', '')
  await expect(summary).toBeFocused()
  await expect(summary).toBeInViewport()
  // The request is used once: coming back to Projects later leaves the project as the learner left it.
  await summary.click()
  await page.reload()
  await expect(page.locator('#project-devops-container-ci')).not.toHaveAttribute('open', '')
})

test('DevOps can be chosen at a phone width without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/paths')
  await chooseTrack(page, 'devops')
  await expect(page.locator('#path-title')).toHaveText('DevOps')
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
