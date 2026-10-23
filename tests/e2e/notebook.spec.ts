import { expect, test } from '@playwright/test'

test('opening another notebook entry asks before discarding unsaved writing', async ({ page }) => {
  await page.goto('/#/notebook')
  const title = page.getByLabel('Title', { exact: true })
  const body = page.getByRole('textbox', { name: 'What you learned', exact: true })
  await page.getByRole('button', { name: 'New entry', exact: true }).click()
  await title.fill('Saved idea')
  await page.getByRole('button', { name: 'Save entry' }).click()
  await expect(page.getByText('Entry saved.')).toBeVisible()

  // An untouched entry is replaced without a question.
  await page.getByRole('button', { name: 'New entry', exact: true }).click()
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(title).toHaveValue('Saved idea')
  await expect(page.getByRole('button', { name: 'Discard changes' })).toHaveCount(0)

  await page.getByRole('button', { name: 'New entry', exact: true }).click()
  await title.fill('Unfinished thought')
  await body.fill('Keep this reasoning.')
  await page.getByRole('button', { name: 'New entry', exact: true }).click()
  const keep = page.getByRole('button', { name: 'Keep editing' })
  await expect(keep).toBeFocused()
  await expect(title).toHaveValue('Unfinished thought')
  await page.keyboard.press('Enter')
  await expect(keep).toHaveCount(0)
  await expect(title).toBeFocused()
  await expect(body).toHaveValue('Keep this reasoning.')

  // Editing a saved entry is guarded the same way, and the draft survives a reload.
  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await expect(title).toHaveValue('Unfinished thought')
  await page.reload()
  await expect(title).toHaveValue('Unfinished thought')
  await expect(body).toHaveValue('Keep this reasoning.')

  await page.getByRole('button', { name: 'Edit', exact: true }).click()
  await page.getByRole('button', { name: 'Discard changes' }).click()
  await expect(title).toHaveValue('Saved idea')
  await expect(body).toHaveValue('')
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible()
})
