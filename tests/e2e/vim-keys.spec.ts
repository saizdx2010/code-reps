import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { editor, expectChecksFinished, replaceCode, route, solution } from './helpers'

/** The draft as persisted, so each step is checked through the real editor, React, and storage. */
const savedCode = (page: Page, repId = 'most-frequent-number') =>
  page.evaluate(
    id =>
      Object.entries(localStorage)
        .filter(([key]) => key.includes(id))
        .map(([, value]) => JSON.parse(value).code)
        .find(code => typeof code === 'string'),
    repId,
  )

async function useTool(page: Page, name: string) {
  await page.getByText('Tools', { exact: true }).click()
  await page.getByRole('button', { name, exact: true }).click()
}

const vimStatus = (page: Page) => page.locator('.vim-status')

// Keys at a person's pace. Machine-speed typing on a loaded machine can lose characters with or without Vim: the editor
// takes a value a keystroke behind its model and writes it back. That race is separate from Vim keys.
const keys = (page: Page, text: string) => page.keyboard.type(text, { delay: 40 })

test('Vim keys edit the draft, run checks with :make, and survive a reload until turned off', async ({ page }) => {
  await page.goto(route)
  // The draft goes in before Vim is on: in Vim, Ctrl+A increments a number instead of selecting all.
  await replaceCode(page, solution)
  await useTool(page, 'Vim keys')
  await expect(vimStatus(page)).toBeVisible()
  await expect(page.getByText('Vim keys · :make or Ctrl / ⌘ Enter to run')).toBeVisible()

  await editor(page).focus()
  await expect(page.getByText('Vim normal mode')).toBeAttached()
  // Delete the first line, then undo it.
  await keys(page, 'ggdd')
  await expect.poll(() => savedCode(page)).toBe(solution.split('\n').slice(1).join('\n'))
  await keys(page, 'u')
  await expect.poll(() => savedCode(page)).toBe(solution)

  // Open a line below the last, type, and leave insert mode. Escape stays with Vim and does not leave focus mode.
  await useTool(page, 'Focus mode')
  await expect(page.locator('main.focus-mode')).toBeVisible()
  await editor(page).focus()
  await keys(page, 'Go')
  await expect(page.getByText('Vim insert mode')).toBeAttached()
  await expect(vimStatus(page)).toContainText('--INSERT--')
  await keys(page, '// vim')
  await page.keyboard.press('Escape')
  await expect(vimStatus(page)).toContainText('--NORMAL--')
  await expect(page.locator('main.focus-mode')).toBeVisible()
  await expect.poll(() => savedCode(page)).toBe(`${solution}\n// vim`)

  // :w explains that drafts already save; :make runs the checks.
  await keys(page, ':w')
  await expect(page.getByRole('textbox', { name: 'Vim command line' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(vimStatus(page)).toContainText('Your draft saves as you type.')
  await editor(page).focus()
  await keys(page, ':make')
  await page.keyboard.press('Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))

  // The setting belongs to the device, so a reload keeps it.
  await page.reload()
  await expect(vimStatus(page)).toBeVisible()
  await expect.poll(() => savedCode(page)).toBe(`${solution}\n// vim`)

  // Turning it off restores ordinary typing without remounting the editor.
  await useTool(page, 'Turn off Vim keys')
  await expect(vimStatus(page)).toHaveCount(0)
  await editor(page).focus()
  // The cursor is still on the last line, where Vim left it.
  await page.keyboard.press('End')
  await keys(page, 'x')
  await expect.poll(() => savedCode(page)).toBe(`${solution}\n// vimx`)
})

test('Vim keys follow the learner between the files of a project', async ({ page }) => {
  await page.goto('/#/practice/fix-quote-bug')
  await useTool(page, 'Vim keys')
  const tabs = page.getByRole('group', { name: 'Project files' })
  await tabs.getByRole('button', { name: 'guard.ts' }).click()
  await expect(tabs.getByRole('button', { name: 'guard.ts' })).toHaveAttribute('aria-pressed', 'true')
  // Each file has its own editor, so Vim attaches again once it opens.
  await editor(page).focus()
  await expect(page.getByText('Vim normal mode')).toBeAttached()
  await keys(page, 'O')
  await expect(vimStatus(page)).toContainText('--INSERT--')
  await keys(page, '// first')
  await page.keyboard.press('Escape')
  await expect(vimStatus(page)).toContainText('--NORMAL--')
  await expect.poll(async () => String(await savedCode(page, 'fix-quote-bug'))).toContain('// first')
})

test('a failed Vim keys load leaves the usual editor and the draft', async ({ page }) => {
  await page.route(/monaco-vim/, route => route.abort())
  await page.goto(route)
  await replaceCode(page, solution)
  await useTool(page, 'Vim keys')
  await expect(page.getByRole('status').filter({ hasText: 'Vim keys could not load.' })).toBeVisible()
  await editor(page).focus()
  await page.keyboard.press('ControlOrMeta+ArrowDown')
  await page.keyboard.press('End')
  await keys(page, 'x')
  await expect.poll(() => savedCode(page)).toBe(`${solution}x`)
})
