import { expect, test } from '@playwright/test'

test('all project levels are freely accessible and self-review preserves an existing notebook draft', async ({ page }) => {
  await page.goto('/#/notebook')
  await page.getByRole('button', { name: 'New entry', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Existing draft')
  await page.getByRole('textbox', { name: 'What you learned', exact: true }).fill('Keep this unfinished reflection.')
  await page.goto('/#/projects')
  await expect(page.getByRole('heading', { name: 'Build outside Code Reps' })).toBeVisible()
  await page.screenshot({ path: 'test-results/browser-projects-desktop.png' })
  const level = page.locator('.project-overview').filter({ has: page.getByRole('heading', { name: 'Level 3: Build an asynchronous local catalog' }) })
  await level.locator(':scope > summary').focus()
  await page.keyboard.press('Enter')
  await expect(level.getByRole('heading', { name: 'Detailed requirements' })).toBeVisible()
  await level.getByText('Final self-review', { exact: true }).click()
  await level.getByRole('button', { name: 'Create level 3 self-review note' }).click()
  await expect(page).toHaveURL(/#\/notebook$/)
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Existing draft')
  await expect(page.getByRole('textbox', { name: 'What you learned', exact: true })).toHaveValue('Keep this unfinished reflection.')
  await expect(page.getByText('Level 3: Build an asynchronous local catalog', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Level 3: Build an asynchronous local catalog', { exact: true })).toBeVisible()
})

test('project requirements and preparation work at narrow widths', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 })
  await page.goto('/#/projects')
  for (const level of [1, 2, 3]) {
    const project = page.locator('.project-overview').filter({ has: page.getByRole('heading', { name: new RegExp(`^Level ${level}:`) }) })
    await project.locator(':scope > summary').click()
    await expect(project.getByRole('heading', { name: 'Detailed requirements' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (level === 1) {
      await project.locator(':scope > summary').scrollIntoViewIfNeeded()
      await page.screenshot({ path: 'test-results/browser-projects-narrow.png' })
    }
  }
  const first = page.locator('.project-overview').filter({ has: page.getByRole('heading', { name: /^Level 1:/ }) })
  await first.getByText('Preparation reps', { exact: true }).click()
  await first.getByRole('button', { name: 'Describe a task state' }).click()
  await expect(page.getByRole('heading', { name: 'Describe a task state', exact: true })).toBeVisible()
})
