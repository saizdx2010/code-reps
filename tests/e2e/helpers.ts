import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

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
  await page.keyboard.press('ControlOrMeta+A')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(text => navigator.clipboard.writeText(text), code)
  await page.keyboard.press('ControlOrMeta+V')
  // Read the saved draft to confirm the whole paste reached React and persistence.
  await expect.poll(() => page.evaluate(id => Object.entries(localStorage)
    .filter(([key]) => key.includes(id))
    .map(([, value]) => JSON.parse(value).code), repId)).toContain(code)
}

export async function saved(page: Page) {
  await expect(page.getByText('Saved in browser', { exact: true }).filter({ visible: true })).toBeVisible()
}

