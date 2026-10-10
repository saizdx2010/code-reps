import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

// Worker startup and Monaco compilation can take longer on a busy machine.
export const CHECK_RUN_COMPLETION_TIMEOUT = 30_000

/** Wait for the exact expected result; failures and partial results remain distinct. */
export async function expectChecksFinished(result: Locator) {
  await expect(result).toBeVisible({ timeout: CHECK_RUN_COMPLETION_TIMEOUT })
}

export const route = '/#/practice/most-frequent-number'
export const solution = `function mostFrequent(numbers: number[]): number | null {
  const counts = new Map<number, number>()
  for (const number of numbers) counts.set(number, (counts.get(number) ?? 0) + 1)
  let best: number | null = null
  for (const [number, count] of counts) {
    if (best === null || count > counts.get(best)! || (count === counts.get(best)! && number < best)) best = number
  }
  return best
}`
export const editor = (page: Page) => page.getByRole('textbox', { name: /^TypeScript solution for/ })

export async function replaceCode(page: Page, code: string, repId = 'most-frequent-number') {
  await expect(editor(page)).toBeVisible()
  await editor(page).focus()
  await expect(editor(page)).toBeFocused()
  await editor(page).press('ControlOrMeta+A')
  // Exercise Monaco's paste handler with test-local data, avoiding a shared OS clipboard.
  await editor(page).evaluate((element, text) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text/plain', text)
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
  }, code)
  // Confirm the complete edit reached React and persistence through the real editor.
  await expect.poll(() => page.evaluate(id => Object.entries(localStorage)
    .filter(([key]) => key.includes(id))
    .map(([, value]) => JSON.parse(value).code), repId)).toContain(code)
}

export async function saved(page: Page) {
  await expect(page.getByText('Saved in browser', { exact: true }).filter({ visible: true })).toBeVisible()
}


/** Exercise the visible app-owned menu, including menus inside native dialogs. */
export async function chooseOption(control: Locator, value: string | { label: string }) {
  await control.click()
  const id = await control.getAttribute('aria-controls')
  const popup = control.page().locator(`[id=${JSON.stringify(id)}]`)
  const option = typeof value === 'string' ? popup.locator(`[role="option"][data-value=${JSON.stringify(value)}]`) : popup.getByRole('option', { name: value.label, exact: true })
  await option.click()
  await expect(control).toHaveAttribute('aria-expanded', 'false')
}

/** Tap one option of a segmented control and confirm it is the pressed one. */
export async function chooseSegment(page: Page, group: string, label: string) {
  const button = page.getByRole('group', { name: group, exact: true }).getByRole('button', { name: label, exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}
