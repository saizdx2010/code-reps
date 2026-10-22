import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseOption, saved } from './helpers'

const route = '/#/practice/break-page-count'
const steps = (page: Page) => page.getByRole('navigation', { name: 'Practice steps' })
const hunt = (page: Page) => page.getByRole('region', { name: 'Your move' })
const log = (page: Page) => page.getByRole('list', { name: 'Your tries, newest first' })
const card = (page: Page) => page.locator('.break-caught')
const sentence = 'Zero items still gives one page, and a last page that comes out exactly full is followed by an empty one.'

async function tryInput(page: Page, items: string, perPage: string) {
  await hunt(page).getByLabel('items', { exact: true }).fill(items)
  await hunt(page).getByLabel('perPage', { exact: true }).fill(perPage)
  await hunt(page).getByRole('button', { name: 'Try it' }).click()
}

/** The tries as saved in this browser's draft, oldest first. */
const savedTries = (page: Page) =>
  page.evaluate(() =>
    Object.entries(localStorage)
      .filter(([key]) => key.includes(':attempt:break-page-count:'))
      .map(([, value]) => (JSON.parse(JSON.parse(value).code) as { input: number[] }[]).map(item => item.input.join(','))),
  )

test('a hunt refuses inputs outside the contract, catches both bugs, keeps its tries, and completes', async ({ page }) => {
  await page.goto(route)
  await expect(page.locator('.break-suspect')).toContainText('return Math.floor(items / perPage) + 1')
  await expect(page.locator('.break-suspect')).toContainText('Read only')
  await expect(hunt(page)).toContainText('2 bugs hidden')
  await expect(hunt(page)).toContainText('No tries yet.')
  await expect(page.locator('.workspace-toolbar')).toHaveCount(0)

  // Same answer: the suspect and the contract agree.
  await tryInput(page, '7', '3')
  const first = log(page).getByRole('listitem').first()
  await expect(first).toContainText('#1')
  await expect(first).toContainText('items 7, perPage 3')
  await expect(first).toContainText('suspect 3')
  await expect(first).toContainText('contract 3')
  await expect(first).toContainText('Same answer')

  // Outside the contract: refused with the rule it breaks, and nothing is added.
  await tryInput(page, '10', '0')
  await expect(hunt(page).getByRole('alert')).toHaveText('Not tried. perPage is a whole number ≥ 1.')
  await expect(hunt(page).getByLabel('perPage', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await expect(hunt(page).getByLabel('perPage', { exact: true })).toBeFocused()
  await tryInput(page, '2.5', '1')
  await expect(hunt(page).getByRole('alert')).toHaveText('Not tried. items is a whole number ≥ 0.')
  await expect(log(page).getByRole('listitem')).toHaveCount(1)

  // A catch strikes the suspect's answer and says so in words.
  await tryInput(page, '10', '5')
  const second = log(page).getByRole('listitem').first()
  await expect(second).toContainText('#2')
  await expect(second.locator('s')).toHaveText('suspect 3, wrong')
  await expect(second).toContainText('contract 2')
  await expect(second).toContainText('Caught one')
  await expect(card(page).getByRole('heading')).toHaveText('1 of 2 bugs caught')
  await expect(card(page)).toContainText('One bug is still hiding.')
  await expect(card(page).locator('.break-meter [data-done]')).toHaveCount(1)
  await expect(steps(page).getByRole('button', { name: 'Solve', exact: true })).toContainText('Needed')
  await card(page).getByRole('button', { name: 'Keep hunting' }).click()
  await expect(hunt(page).getByLabel('items', { exact: true })).toBeFocused()

  // A second catch of the other bug finishes the hunt; trying an input again points at the earlier try.
  await tryInput(page, '0', '5')
  await expect(log(page).getByRole('listitem').first()).toContainText('Caught one')
  await expect(card(page).getByRole('heading')).toHaveText('All 2 bugs caught')
  await expect(hunt(page)).toContainText('All bugs caught')
  await expect(steps(page).getByRole('button', { name: 'Solve', exact: true })).toContainText('Done')
  await tryInput(page, '10', '5')
  await expect(hunt(page).getByRole('status').filter({ hasText: 'already tried' })).toHaveText(
    'You already tried items 10, perPage 5: it is try #2.',
  )
  await expect(log(page).getByRole('listitem')).toHaveCount(3)

  // Name the bugs. This is the attempt's explanation, the same text as the Explain step.
  await card(page).getByLabel('What are the bugs? One sentence each.').fill(sentence)
  await saved(page)
  expect(await savedTries(page)).toEqual([['7,3', '10,5', '0,5']])

  // Reload: the tries, the count, and the sentence come back, and the saved tries are checked again.
  await page.reload()
  await expect(log(page).getByRole('listitem')).toHaveCount(3)
  await expect(log(page).getByRole('listitem').first()).toContainText('items 0, perPage 5')
  await expect(card(page).getByRole('heading')).toHaveText('All 2 bugs caught')
  await expect(card(page).getByRole('textbox')).toHaveValue(sentence)
  await expect(steps(page).getByRole('button', { name: 'Solve', exact: true })).toContainText('Done')
  await steps(page).getByRole('button', { name: 'Explain', exact: true }).click()
  await expect(page.getByLabel('Your explanation', { exact: true })).toHaveValue(sentence)

  // Complete: the plan is written, every bug is caught, and the explanation is there.
  await steps(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Try 0 items, items equal to perPage, and a last page that comes out full.')
  await steps(page).getByRole('button', { name: 'Finish', exact: true }).click()
  await expect(steps(page).getByRole('button', { name: 'Finish', exact: true })).toContainText('Ready')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await expect(page.locator('.completion-panel')).toContainText('Rep completed')
  await expect(page.locator('.completion-receipt')).toContainText('All 3 passed')
  await saved(page)

  // The completed attempt keeps its tries after another reload.
  await page.reload()
  await expect(log(page).getByRole('listitem')).toHaveCount(3)
  await expect(steps(page).getByRole('button', { name: 'Finish', exact: true })).toContainText('Done')
})

test('tries are a draft: they survive navigation and stay with their profile', async ({ page }) => {
  await page.goto(route)
  await tryInput(page, '6', '3')
  await expect(log(page).getByRole('listitem').first()).toContainText('Caught one')
  await saved(page)

  // Leave for the Library and come back.
  await page.goto('/#/practice')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.goto(route)
  await expect(log(page).getByRole('listitem')).toHaveCount(1)
  await expect(card(page).getByRole('heading')).toHaveText('1 of 2 bugs caught')

  // A new profile starts its own hunt; switching back restores the first one.
  await page.getByRole('button', { name: 'Manage profiles' }).click()
  const dialog = page.getByRole('dialog', { name: 'Local profiles' })
  await dialog.getByText('New profile', { exact: true }).click()
  await dialog.getByLabel('Profile name', { exact: true }).fill('Hunt test learner')
  await dialog.getByRole('button', { name: 'Create profile', exact: true }).click()
  await expect(dialog.getByRole('status')).toHaveText('Profile created.')
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto(route)
  await expect(hunt(page)).toContainText('No tries yet.')
  await expect(hunt(page)).toContainText('2 bugs hidden')
  await page.getByRole('button', { name: 'Manage profiles' }).click()
  await chooseOption(dialog.getByRole('combobox', { name: 'Switch profile', exact: true }), { label: 'My learning' })
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await page.goto(route)
  await expect(log(page).getByRole('listitem')).toHaveCount(1)
  await expect(log(page).getByRole('listitem').first()).toContainText('items 6, perPage 3')
})

test('stopping a running try adds nothing, and the next try still runs', async ({ page }) => {
  // Hold the practice worker's script so the first try stays running until it is stopped.
  let release = () => {}
  const held = new Promise<void>(resolve => (release = resolve))
  await page.route(/runner\.worker/, async handle => {
    await held
    await handle.continue()
  })
  await page.goto(route)
  await tryInput(page, '0', '4')
  await expect(log(page).getByRole('listitem').first()).toContainText('Running')
  await hunt(page).getByRole('button', { name: 'Stop', exact: true }).click()
  await expect(hunt(page).getByRole('status').filter({ hasText: 'Stopped' })).toHaveText(
    'Stopped. Nothing was added, and your tries are unchanged.',
  )
  await expect(hunt(page)).toContainText('No tries yet.')
  // Let the worker load: the held requests and every later one go through.
  release()
  await hunt(page).getByRole('button', { name: 'Try it' }).click()
  await expect(log(page).getByRole('listitem')).toHaveCount(1)
  await expect(log(page).getByRole('listitem').first()).toContainText('Caught one')
  await saved(page)
  expect(await savedTries(page)).toEqual([['0,4']])
})
