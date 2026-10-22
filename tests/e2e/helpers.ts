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
export const editor = (page: Page) => page.getByRole('textbox', { name: /^(TypeScript solution|SQL query) for/ })

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
  await expect
    .poll(() =>
      page.evaluate(
        id =>
          Object.entries(localStorage)
            .filter(([key]) => key.includes(id))
            .map(([, value]) => JSON.parse(value).code),
        repId,
      ),
    )
    .toContain(code)
}

export async function saved(page: Page) {
  await expect(page.getByText('Saved in browser', { exact: true }).filter({ visible: true })).toBeVisible()
}

/** Exercise the visible app-owned menu, including menus inside native dialogs. */
export async function chooseOption(control: Locator, value: string | { label: string }) {
  await control.click()
  const id = await control.getAttribute('aria-controls')
  const popup = control.page().locator(`[id=${JSON.stringify(id)}]`)
  const option =
    typeof value === 'string'
      ? popup.locator(`[role="option"][data-value=${JSON.stringify(value)}]`)
      : popup.getByRole('option', { name: value.label, exact: true })
  await option.click()
  await expect(control).toHaveAttribute('aria-expanded', 'false')
}

/** Tap one option of a segmented control and confirm it is the pressed one. */
export async function chooseSegment(page: Page, group: string, label: string) {
  const button = page.getByRole('group', { name: group, exact: true }).getByRole('button', { name: label, exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}

/** Fail when two horizontal dividers stack with nothing visible between them. */
export async function expectNoStackedDividers(page: Page, label = page.url()) {
  const stacked = await page.evaluate(() => {
    const lines: { y: number; left: number; right: number; label: string }[] = []
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      const box = element.getBoundingClientRect()
      if (!box.width || !box.height) continue
      const style = getComputedStyle(element)
      if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
      const label = `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`
      if (
        parseFloat(style.borderTopWidth) > 0 &&
        style.borderTopStyle !== 'none' &&
        style.borderTopColor !== 'rgba(0, 0, 0, 0)' &&
        style.borderLeftStyle === 'none'
      )
        lines.push({ y: box.top + scrollY, left: box.left, right: box.right, label })
      if (
        parseFloat(style.borderBottomWidth) > 0 &&
        style.borderBottomStyle !== 'none' &&
        style.borderBottomColor !== 'rgba(0, 0, 0, 0)' &&
        style.borderLeftStyle === 'none'
      )
        lines.push({ y: box.bottom + scrollY, left: box.left, right: box.right, label })
    }
    const content = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(
        element =>
          element.checkVisibility() &&
          ([...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) ||
            ['BUTTON', 'INPUT', 'IMG', 'SVG', 'PROGRESS'].includes(element.tagName.toUpperCase())),
      )
      .map(element => element.getBoundingClientRect())
      .filter(box => box.width && box.height)
      .map(box => ({ top: box.top + scrollY, bottom: box.bottom + scrollY, left: box.left, right: box.right }))
    lines.sort((a, b) => a.y - b.y)
    const found: string[] = []
    for (let i = 0; i < lines.length; i++)
      for (let j = i + 1; j < lines.length && lines[j].y - lines[i].y < 80; j++) {
        const a = lines[i],
          b = lines[j]
        if (b.y - a.y < 3 && a.label === b.label) continue
        const left = Math.max(a.left, b.left),
          right = Math.min(a.right, b.right)
        if (right - left < 40 || b.y - a.y < 1) continue
        const between = content.some(box => box.top >= a.y - 1 && box.bottom <= b.y + 1 && box.right > left && box.left < right)
        if (!between) found.push(`${a.label} @${Math.round(a.y)} / ${b.label} @${Math.round(b.y)}`)
      }
    return found
  })
  expect(stacked, label).toEqual([])
}

/** Chooses a track on All tracks: its card on a wide screen, the Choose track menu on a narrow one. */
export async function chooseTrack(page: Page, id: string) {
  const menu = page.getByRole('combobox', { name: 'Choose track', exact: true })
  // Wait for the page, so the choice between menu and cards is made on what the learner sees.
  await expect(page.locator('#path-title')).toBeVisible()
  if (await menu.isVisible()) return chooseOption(menu, id)
  const { paths } = await import('../../src/path')
  const title = paths.find(path => path.id === id)!.title
  await page.locator('.track-map .path-choices > button', { has: page.locator('strong', { hasText: new RegExp(`^${title}$`) }) }).click()
}
