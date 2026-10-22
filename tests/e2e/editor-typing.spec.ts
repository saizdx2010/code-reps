import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { editor, replaceCode, route, solution } from './helpers'

// The open draft, read from its own key: Reset rep keeps the previous attempt in history.
const savedCode = (page: Page, repId = 'most-frequent-number') =>
  page.evaluate(id => {
    const draft = localStorage.getItem(`code-reps:profile:default:attempt:${id}:v1`)
    return draft === null ? undefined : (JSON.parse(draft).code as string)
  }, repId)

// A slow CPU lets keystrokes arrive while the app is still rendering an earlier draft. The editor must keep every key
// instead of taking that older draft back.
test('fast typing on a slow machine keeps every character', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
  await editor(page).focus()
  await page.keyboard.press('ControlOrMeta+ArrowDown')
  await page.keyboard.press('End')
  const typed = '\n// every key typed at machine speed stays in the draft'
  await page.keyboard.type(typed)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await expect.poll(() => savedCode(page)).toBe(solution + typed)
})

test('Reset rep still replaces the open editor text, and typing continues from the starter', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  await expect(page.locator('.view-lines')).toContainText('counts.set')
  await page.getByText('Tools', { exact: true }).click()
  await page.locator('.workspace-options').getByRole('button', { name: 'Reset rep' }).click()
  await page.locator('.reset-dialog-confirm').click()
  await expect(page.locator('.view-lines')).not.toContainText('counts.set')
  await expect.poll(async () => String(await savedCode(page))).not.toContain('counts.set')
  const starter = String(await savedCode(page))
  await editor(page).focus()
  await page.keyboard.press('ControlOrMeta+ArrowDown')
  await page.keyboard.press('End')
  await page.keyboard.type('\n// after reset')
  await expect.poll(() => savedCode(page)).toBe(`${starter}\n// after reset`)
})
