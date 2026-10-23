import { expect, test } from '@playwright/test'

test('a rep opened from the trail leads back to the trail, where the page was left, and steps through the track', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.locator('#continue-heading')).toBeVisible()
  await page.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }))
  const node = page.locator('.trail-node-title', { hasText: /^Use basic types$/ })
  await node.scrollIntoViewIfNeeded()
  const left = await page.evaluate(() => scrollY)
  expect(left).toBeGreaterThan(0)
  await node.click()
  await expect(page.getByRole('heading', { level: 1, name: 'Use basic types' })).toBeVisible()
  const back = page.getByRole('button', { name: 'Back to Your trail', exact: true })
  await expect(back).toBeVisible()
  const stepper = page.getByRole('group', { name: /^Foundations: rep 2 of \d+$/ })
  await expect(stepper).toBeVisible()
  // Next keeps the trail as the way back.
  await stepper.getByRole('button', { name: /^Next: / }).click()
  await expect(page.getByRole('group', { name: /^Foundations: rep 3 of \d+$/ })).toBeVisible()
  await expect(back).toBeVisible()
  await back.click()
  await expect(page).toHaveURL(/#\/home$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(left)
})

test('the switcher lists the Library topic, opens on the current rep, and closes with Escape', async ({ page }) => {
  await page.goto('/#/practice')
  await page.getByLabel('Find a rep', { exact: true }).fill('Check balanced brackets')
  await page.locator('.catalog-list .list-row > button').first().click()
  await expect(page.getByRole('button', { name: 'Back to Library', exact: true })).toBeVisible()
  const summary = page.locator('.rep-switcher > summary')
  await summary.click()
  const current = page.locator('.rep-switcher button[aria-current="true"]')
  await expect(current).toHaveText('Check balanced brackets')
  await expect(current).toBeInViewport()
  await page.keyboard.press('Escape')
  await expect(page.locator('.rep-switcher')).not.toHaveAttribute('open', '')
  await expect(summary).toBeFocused()
  await summary.click()
  await page.locator('.rep-switcher li button').first().click()
  await expect(page.locator('.rep-switcher')).not.toHaveAttribute('open', '')
  await expect(page.getByRole('button', { name: 'No previous rep' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Back to Library', exact: true })).toBeVisible()
})

test('a phone keeps the back link, the stepper, Glossary, and Tools on one row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/home')
  await page.locator('.trail-node-title', { hasText: /^Use basic types$/ }).click()
  const back = page.getByRole('button', { name: 'Back to Your trail', exact: true })
  await expect(page.locator('.rep-stepper')).toBeVisible()
  const top = async (selector: string) => Math.round((await page.locator(selector).first().boundingBox())!.y)
  const row = await top('.breadcrumb-link')
  for (const selector of ['.rep-stepper', '.workspace-options > summary']) expect(Math.abs((await top(selector)) - row)).toBeLessThan(8)
  await page.locator('.rep-switcher > summary').click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.keyboard.press('Escape')
  await back.click()
  await expect(page).toHaveURL(/#\/home$/)
})

for (const width of [1440, 390]) {
  test(`Tools keeps one order and reads from the left at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/practice/count-above-threshold')
    const tools = page.locator('.workspace-options')
    await tools.locator('> summary').click()
    // Settings, related concepts, then Reset rep apart from the rest, in that order at every width.
    const rows = await tools.locator('> div > *').evaluateAll(elements =>
      elements.map(element => {
        const box = element.getBoundingClientRect()
        // A toggle's first text is its name; its On or Off chip follows.
        const text = element.matches('.workspace-knowledge') ? 'Related concepts' : element.firstChild?.textContent
        return { text, top: box.top, left: box.left, width: box.width }
      }),
    )
    expect(rows.map(row => row.text)).toEqual(['Focus mode', 'Vim keys', 'Related concepts', 'Reset rep'])
    expect(rows.map(row => row.top)).toEqual([...rows.map(row => row.top)].sort((a, b) => a - b))
    for (const row of rows) {
      expect(Math.abs(row.left - rows[0].left)).toBeLessThan(1)
      expect(Math.abs(row.width - rows[0].width)).toBeLessThan(1)
    }
    const reset = tools.getByRole('button', { name: 'Reset rep', exact: true })
    await expect(reset).toHaveClass(/danger-button/)
    const resetText = await reset.evaluate(element => {
      const range = document.createRange()
      range.selectNodeContents(element)
      return range.getBoundingClientRect().left - element.getBoundingClientRect().left
    })
    expect(resetText).toBeLessThan(20)
    // Focus mode and Vim keys are settings: each says whether it is on.
    const focus = tools.getByRole('button', { name: 'Focus mode', exact: true })
    await expect(focus).toHaveAttribute('aria-pressed', 'false')
    await expect(focus).toContainText('Off')
    await focus.click()
    await expect(page.locator('main.focus-mode')).toBeVisible()
    await tools.locator('> summary').click()
    await expect(focus).toHaveAttribute('aria-pressed', 'true')
    await expect(focus).toContainText('On')
    await page.keyboard.press('Escape')
    await expect(tools).not.toHaveAttribute('open', '')
  })
}
