import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const route = '/#/practice/most-frequent-number'
const solution = `function mostFrequent(numbers: number[]): number | null {
  const counts = new Map<number, number>()
  for (const number of numbers) counts.set(number, (counts.get(number) ?? 0) + 1)
  let best: number | null = null
  for (const [number, count] of counts) {
    if (best === null || count > counts.get(best)! || (count === counts.get(best)! && number < best)) best = number
  }
  return best
}`
const editor = (page: Page) => page.getByRole('textbox', { name: /^TypeScript solution for/ })

async function replaceCode(page: Page, code: string) {
  await expect(editor(page)).toBeVisible()
  await page.locator('.monaco-editor .view-lines').click({ position: { x: 40, y: 80 } })
  await page.keyboard.press('ControlOrMeta+A')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate(text => navigator.clipboard.writeText(text), code)
  await page.keyboard.press('ControlOrMeta+V')
  // Read the saved draft to confirm the whole paste reached React and persistence.
  await expect.poll(() => page.evaluate(() => Object.entries(localStorage)
    .filter(([key]) => key.includes('most-frequent-number'))
    .map(([, value]) => JSON.parse(value).code))).toContain(code)
}

async function saved(page: Page) {
  await expect(page.getByText('Saved in browser', { exact: true }).filter({ visible: true })).toBeVisible()
}

test('real Monaco editing, keyboard checks, and obsolete feedback', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, solution)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible()
  await replaceCode(page, 'function mostFrequent(numbers: number[]): number | null { return null }')
  await expect(page.getByText('All checks passed', { exact: true })).toHaveCount(0)
  await page.locator('.code-actions').getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('1 of 6 checks passed', { exact: true })).toBeVisible()
})

test('reload preserves code and planning drafts', async ({ page }) => {
  await page.goto(route)
  await page.getByLabel('YOUR PLAN', { exact: true }).fill('Count values, then resolve ties with the smaller value.')
  await replaceCode(page, solution)
  await saved(page)
  await page.reload()
  await expect(page.getByLabel('YOUR PLAN', { exact: true })).toHaveValue('Count values, then resolve ties with the smaller value.')
  await expect(editor(page)).toBeVisible()
  await page.locator('.code-actions').getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible()
})

test('profile switching keeps drafts separate', async ({ page }) => {
  await page.goto(route)
  await page.getByLabel('YOUR PLAN', { exact: true }).fill('Original profile plan')
  await replaceCode(page, solution)
  await page.getByRole('button', { name: 'Manage profiles' }).click()
  const dialog = page.getByRole('dialog', { name: 'Local profiles' })
  await dialog.getByLabel('Profile name', { exact: true }).fill('Browser test learner')
  await dialog.getByRole('button', { name: 'Create profile', exact: true }).click()
  await expect(dialog.getByRole('status')).toHaveText('Profile created.')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto(route)
  await expect(page.getByLabel('YOUR PLAN', { exact: true })).toHaveValue('')
  await expect(editor(page)).toBeVisible()
  await expect(page.locator('.view-lines')).toContainText('Write your solution here')
  await page.getByLabel('YOUR PLAN', { exact: true }).fill('Separate learner plan')
  await page.getByRole('button', { name: 'Manage profiles' }).click()
  await dialog.getByLabel('Switch profile').selectOption({ label: 'My learning' })
  await expect(dialog.getByLabel('Switch profile')).toHaveValue('default')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto(route)
  await expect(page.getByLabel('YOUR PLAN', { exact: true })).toHaveValue('Original profile plan')
  await expect(editor(page)).toBeVisible()
  await page.locator('.code-actions').getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible()
})

test('narrow workspace preserves planning and supports keyboard exit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(route)
  await page.getByRole('button', { name: 'Task & plan', exact: true }).click()
  await page.getByLabel('YOUR PLAN', { exact: true }).fill('A narrow-screen draft')
  await page.getByRole('button', { name: 'Code & results', exact: true }).click()
  await replaceCode(page, solution)
  await page.keyboard.press('Tab')
  await expect(editor(page)).not.toBeFocused()
  await page.locator('.code-actions').getByRole('button', { name: /Run checks/ }).click()
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible()
  await saved(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Task & plan', exact: true }).click()
  await expect(page.getByLabel('YOUR PLAN', { exact: true })).toHaveValue('A narrow-screen draft')
})
