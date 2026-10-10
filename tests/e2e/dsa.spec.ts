import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'

test('discover the combined path and complete a queue introduction', async ({ page }) => {
  await page.goto('/#/paths')
  const picker = page.locator('.path-picker')
  if (await picker.getAttribute('open') === null) await picker.locator('summary').click()
  await page.getByRole('button', { name: /^Problem solving/ }).click()
  await expect(page.locator('#path-title')).toHaveText('Problem solving')
  const stage = page.locator('.path-stage').filter({ hasText: 'Stack and queue operations' })
  await stage.locator('summary').click()
  await stage.getByRole('button', { name: /Enqueue, dequeue, and peek a queue/ }).click()
  await expect(page).toHaveURL(/practice\/ds-queue-operations/)
  await replaceCode(page, `function queueFront(numbers: number[], extra: number): number | null {
    const queue: number[] = [...numbers]
    queue.push(extra)
    queue.shift()
    return queue[0] ?? null
  }`, 'ds-queue-operations')
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.reload()
  await expect(page.getByRole('textbox', { name: /^TypeScript solution for/ })).toBeVisible()
  await page.locator('.workspace-toolbar').getByRole('button', { name: /Run checks/ }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
})

for (const width of [1280, 320]) {
  test(`visible path menu supports keyboard selection and reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/paths')
    const menu = page.getByRole('combobox', { name: 'Choose track', exact: true })
    await expect(menu).toBeVisible()
    await menu.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('p')
    await page.keyboard.press('Enter')
    await expect(menu).toHaveAttribute('data-value', 'algorithms-data-structures')
    await expect(page.locator('#path-title')).toHaveText('Problem solving')
    await expect(menu).toBeFocused()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/path-menu-${width}.png`, fullPage: true })
    await page.reload()
    await expect(menu).toHaveAttribute('data-value', 'algorithms-data-structures')
    await expect(page.locator('#path-title')).toHaveText('Problem solving')
  })
}
