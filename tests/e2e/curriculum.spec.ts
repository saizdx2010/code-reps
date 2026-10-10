import { expect, test } from '@playwright/test'
import { chooseOption } from './helpers'

for (const width of [1280, 320]) {
  test(`path goal is explicit and survives reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/paths')
    await chooseOption(page.getByRole('combobox', { name: 'Choose track', exact: true }), 'frontend')
    await expect(page.getByText('Browsing this track does not change your learning goal.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Browsing this track does not change your learning goal.')).toBeVisible()
    const selectGoal = page.getByRole('button', { name: 'Use this as my learning goal' })
    await selectGoal.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('Your current learning goal.')).toBeVisible()
    await page.getByRole('button', { name: 'Trail', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Learning goal' })).toContainText('Frontend')
    await expect(page.locator('.continue-panel')).toContainText('selected learning goal: Frontend')
    await page.reload()
    await expect(page.getByRole('region', { name: 'Learning goal' })).toContainText('Frontend')
    await page.getByRole('button', { name: 'View or choose goal' }).click()
    await expect(page.getByRole('heading', { name: 'Apply this track in a project' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/curriculum-${width}.png`, fullPage: true })
    await page.getByRole('button', { name: 'Open project milestone' }).click()
    await expect(page).toHaveURL(/practice\/project-team-directory/)
  })
}

test('early recall remains accessible without claiming retention', async ({ page }) => {
  await page.goto('/#/paths')
  const stage = page.locator('.path-stage').filter({ hasText: 'Work through arrays' })
  await stage.locator('summary').click()
  const recall = stage.getByRole('button', { name: /Count values above a limit/ })
  await expect(recall).toContainText('Complete independent practice without hints to schedule recall.')
  await recall.click()
  await expect(page).toHaveURL(/practice\/count-above-threshold/)
})

for (const width of [1280, 390]) {
  test(`home trail interleaves lessons, marks the next rep, and links shared Foundations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/home')
    await page.locator('.starting-point-settings > summary').click()
    await page.getByRole('button', { name: /New to coding/ }).click()
    const trail = page.getByRole('region', { name: 'Learning goal' })
    await expect(trail.getByRole('heading', { level: 1 })).toHaveText('Foundations')
    const firstStage = trail.locator('.path-stage').first()
    const nodes = firstStage.locator('.trail-node')
    await expect(nodes.first()).toHaveClass(/node-lesson/)
    await expect(firstStage.locator('button[aria-current="step"]')).toContainText('Declare a value')
    await expect(firstStage.locator('button[aria-current="step"]')).toContainText('Beginner')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await nodes.first().getByRole('button').click()
    await expect(page).toHaveURL(/#\/knowledge$/)
    await expect(page.getByRole('heading', { name: 'Values, types, and functions', exact: true })).toBeVisible()
    await page.goBack()
    await firstStage.locator('button[aria-current="step"]').click()
    await expect(page).toHaveURL(/practice\/declare-variables/)
    await expect(page.locator('.workspace-title')).toContainText('Beginner')
    await page.goto('/#/paths')
    await chooseOption(page.getByRole('combobox', { name: 'Choose track', exact: true }), 'algorithms-data-structures')
    const covered = page.locator('.path-stage').filter({ hasText: 'Covered in Foundations' }).first()
    await expect(covered).toContainText('Covered in Foundations')
    await covered.locator('summary').click()
    await covered.getByRole('button', { name: 'Open Foundations', exact: true }).click()
    await expect(page.locator('#path-title')).toHaveText('Foundations')
  })
}

for (const width of [1280, 390]) {
  test(`next practice names the task and completed stages recap the work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/home')
    const card = page.locator('.continue-panel')
    await expect(card).toContainText('Next: Declare a value — Create a const named greeting')
    const firstStage = page.locator('.path-stage').first()
    await expect(firstStage.locator('summary')).not.toContainText('You can now')
    await card.screenshot({ path: `/tmp/code-reps-polish/6/next-practice-${width}.png` })
    // Only this test's fresh browser context receives sample completion history.
    await page.evaluate(() => {
      const base = { plan: 'Recorded plan', code: 'Recorded code', explanation: 'Recorded explanation', hintCount: 0, confidence: 'confident', difficulty: 'none' }
      const history = ['declare-variables', 'basic-types', 'create-objects', 'make-arrays', 'write-functions'].map((repId, index) => ({ ...base, id: `stage-${index}`, repId, completedAt: new Date().toISOString() }))
      localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(history))
    })
    await page.reload()
    await expect(firstStage.locator('summary')).toContainText('You can now declare values, use types, create objects and arrays, and write small functions.')
    await expect(firstStage).not.toHaveAttribute('open')
    await firstStage.screenshot({ path: `/tmp/code-reps-polish/6/completed-stage-${width}.png` })
    await firstStage.locator('summary').focus()
    await page.keyboard.press('Enter')
    await expect(firstStage).toHaveAttribute('open', '')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
