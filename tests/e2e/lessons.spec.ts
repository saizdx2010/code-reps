import { expect, test } from '@playwright/test'

const heading = (page: import('@playwright/test').Page, name: string) =>
  page.locator('.knowledge-article').getByRole('heading', { name, exact: true })

test('every lesson has an address that survives reload, and Back returns to the previous lesson', async ({ page }) => {
  await page.goto('/#/knowledge/arrays')
  await expect(heading(page, 'Arrays and one-pass reasoning')).toBeVisible()
  await page.reload()
  await expect(heading(page, 'Arrays and one-pass reasoning')).toBeVisible()
  await page.locator('section').filter({ hasText: 'Related knowledge' }).getByRole('button').first().click()
  await expect(page).not.toHaveURL(/#\/knowledge\/arrays$/)
  await expect(page).toHaveURL(/#\/knowledge\/[a-z-]+$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/knowledge\/arrays$/)
  await expect(heading(page, 'Arrays and one-pass reasoning')).toBeVisible()
  // An unknown lesson link opens the lessons page instead of failing.
  await page.goto('/#/knowledge/not-a-lesson')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the first prediction is the evidence; later checks are practice and explain the chosen option', async ({ page }) => {
  await page.goto('/#/knowledge/values')
  await page.getByRole('button', { name: 'Predict', exact: true }).click()
  const question = page.locator('fieldset.lesson-question').first()
  await question.getByRole('radio', { name: '3', exact: true }).check()
  await question.getByRole('button', { name: 'Check prediction', exact: true }).click()
  const feedback = question.locator('.lesson-feedback')
  await expect(feedback).toContainText('Revisit this idea.')
  await expect(feedback).toContainText('You chose 3; the answer is 6.')
  await expect(feedback).toContainText('Your first prediction')
  await expect(question.locator('label.is-answer')).toContainText('6')
  // Changing the choice hides the old verdict until the new choice is checked.
  await question.getByRole('radio', { name: '6', exact: true }).check()
  await expect(feedback).toHaveCount(0)
  await question.getByRole('button', { name: 'Check again (practice)', exact: true }).click()
  await expect(feedback).toContainText('Correct prediction.')
  await expect(feedback).toContainText('Practice check: your first prediction stays as your evidence.')
  // The recorded first prediction is unchanged after reload.
  await page.reload()
  await expect(question.locator('.lesson-feedback')).toContainText('Revisit this idea.')
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await expect(page.locator('.skill-evidence')).toContainText('0 of 2 predictions correct on the first check.')
})

test('sections show progress and each ends with the next step', async ({ page }) => {
  await page.goto('/#/knowledge/values')
  const tabs = page.getByRole('navigation', { name: 'Lesson sections' })
  await expect(tabs.getByRole('button', { name: 'Predict', exact: true })).toContainText('0/2')
  await page.locator('#lesson-read .lesson-next').getByRole('button').click()
  await expect(tabs.getByRole('button', { name: 'Predict', exact: true })).toHaveAttribute('aria-current', 'location')
  await page.locator('#lesson-predict .lesson-next').getByRole('button').click()
  await expect(tabs.getByRole('button', { name: 'Practice', exact: true })).toHaveAttribute('aria-current', 'location')
  await expect(page.locator('#lesson-practise .list-row')).toHaveCount(5)
})

test('a rep opened from a lesson leads back to that lesson', async ({ page }) => {
  await page.goto('/#/knowledge/values')
  await page.getByRole('button', { name: 'Practice', exact: true }).click()
  await page.locator('#lesson-practise .list-row button').first().click()
  await expect(page).toHaveURL(/#\/practice\//)
  const back = page.getByRole('button', { name: 'Back to the lesson Values, types, and functions' })
  await expect(back).toBeVisible()
  await back.click()
  await expect(page).toHaveURL(/#\/knowledge\/values$/)
  // Opening the same rep from the Library keeps the Library back link.
  await page.goto('/#/practice')
  await page.getByLabel('Find a rep', { exact: true }).fill('Declare a value')
  await page.locator('.catalog-list .list-row button').first().click()
  await expect(page.locator('.breadcrumb-link')).toHaveText('Library')
})
