import { expect, test } from '@playwright/test'
import { chooseOption } from './helpers'
import { catalogAreas } from '../../src/catalog-labels'

test('exercises are grouped by area in learning order, and opening a topic never moves it', async ({ page }) => {
  await page.goto('/#/practice')
  const areas = page.locator('.catalog-area h3')
  await expect(areas.first()).toHaveText('Language & problem solving')
  await expect(areas).toHaveCount(catalogAreas.length)
  const arrays = page.locator('.catalog-area .list-group').filter({ has: page.locator('.list-group-title', { hasText: /^Arrays$/ }) })
  await expect(arrays.locator('summary')).toContainText(/(?:^|\D)0 of \d+ done/)
  const place = () =>
    arrays.evaluate(element => [
      Math.round(element.getBoundingClientRect().left),
      Math.round(element.getBoundingClientRect().top + scrollY),
    ])
  // Measure after the page's arrival motion, which moves the whole page a few pixels.
  await page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'))
  const before = await place()
  await arrays.locator('summary').click()
  await expect(arrays).toHaveAttribute('open', '')
  // Measured once the press settles: the topic keeps its place; only the topics below it move down.
  await expect.poll(place).toEqual(before)
  // Untouched reps carry no status chip; the level stays visible.
  const row = arrays.locator('.list-row').first()
  await expect(row.locator('.status-chip')).toHaveCount(0)
  await expect(row.locator('.list-row-level')).toHaveText('Beginner')
})

test('search finds concept words through the lessons a rep practises', async ({ page }) => {
  await page.goto('/#/practice')
  const search = page.getByLabel('Find a rep', { exact: true })
  for (const query of ['binary search', 'two pointers', 'promise']) {
    await search.fill(query)
    await expect(page.locator('.catalog-list .list-row').first()).toBeVisible()
  }
  await search.fill('zzzz unknown')
  const empty = page.locator('.catalog-list .empty-state')
  await expect(empty).toContainText('No reps mention “zzzz unknown”.')
  await empty.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(search).toHaveValue('')
  await expect(page.locator('.catalog-area')).toHaveCount(catalogAreas.length)
})

test('the level filter narrows the list and empty filters say why', async ({ page }) => {
  await page.goto('/#/practice')
  await chooseOption(page.getByLabel('Level', { exact: true }), { label: 'Advanced' })
  const levels = await page.locator('.catalog-list .list-row-level').allTextContents()
  expect(levels.length).toBeGreaterThan(0)
  expect(new Set(levels)).toEqual(new Set(['Advanced']))
  await page.getByRole('button', { name: 'Clear filters', exact: true }).first().click()
  await chooseOption(page.getByLabel('Your progress', { exact: true }), 'Completed')
  await expect(page.locator('.catalog-list .empty-state')).toContainText('No completed reps yet. Finish a rep and it appears here.')
})

test('a topic saved under an old label is ignored instead of hiding every rep', async ({ page }) => {
  await page.goto('/#/practice')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:default:catalogSkill', 'Practical concepts'))
  await page.reload()
  await expect(page.locator('.catalog-area')).toHaveCount(catalogAreas.length)
})
