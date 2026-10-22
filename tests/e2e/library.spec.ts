import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseOption } from './helpers'
import { catalogAreas } from '../../src/catalog-labels'

const topicButton = (page: Page, name: string) =>
  page.locator('.catalog-rail-list button', { has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) })

test('the topic rail lists areas in learning order and opens one topic beside it', async ({ page }) => {
  await page.goto('/#/practice')
  const areas = page.locator('.catalog-rail-group h2')
  await expect(areas.first()).toHaveText('Language & problem solving')
  await expect(areas).toHaveCount(catalogAreas.length)
  // A new learner starts on the suggested reps.
  await expect(page.locator('#catalog-pane-title')).toHaveText('Start here')
  const arrays = topicButton(page, 'Arrays')
  await expect(arrays).toContainText(/0 of \d+ done/)
  const place = () => arrays.evaluate(element => Math.round(element.getBoundingClientRect().top))
  // Measure after the page's arrival motion, which moves the whole page a few pixels.
  const settled = () => page.waitForFunction(() => document.getAnimations().every(animation => animation.playState !== 'running'))
  await settled()
  const before = await place()
  await arrays.click()
  await expect(arrays).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('#catalog-pane-title')).toHaveText('Arrays')
  // Choosing a topic never moves the rail.
  await settled()
  expect(await place()).toBe(before)
  // Untouched reps carry no status chip; the level stays visible.
  const row = page.locator('.catalog-list .list-row').first()
  await expect(row.locator('.status-chip')).toHaveCount(0)
  await expect(row.locator('.list-row-level')).toHaveText('Beginner')
  // The end of a topic offers the next one, and the choice survives a reload.
  await page.getByRole('button', { name: /^Next topic/ }).click()
  await expect(page.locator('#catalog-pane-title')).toHaveText('Text')
  await page.reload()
  await expect(page.locator('#catalog-pane-title')).toHaveText('Text')
})

test('search finds concept words through the lessons a rep practises', async ({ page }) => {
  await page.goto('/#/practice')
  const search = page.getByLabel('Find a rep', { exact: true })
  for (const query of ['binary search', 'two pointers', 'promise']) {
    await search.fill(query)
    await expect(page.locator('.catalog-list .list-row').first()).toBeVisible()
  }
  await search.fill('zzzz unknown')
  const empty = page.locator('.catalog-pane .empty-state')
  await expect(empty).toContainText('No reps mention “zzzz unknown”.')
  await empty.getByRole('button', { name: 'Clear search', exact: true }).click()
  await expect(search).toHaveValue('')
  await expect(page.locator('#catalog-pane-title')).toHaveText('Start here')
})

test('the level filter narrows the list and empty filters say why', async ({ page }) => {
  await page.goto('/#/practice')
  await topicButton(page, 'Arrays').click()
  await chooseOption(page.getByLabel('Level', { exact: true }), { label: 'Advanced' })
  await expect(page.locator('.catalog-pane .empty-state')).toContainText('No reps here match these filters.')
  await topicButton(page, 'Harder patterns').click()
  const levels = await page.locator('.catalog-list .list-row-level').allTextContents()
  expect(levels.length).toBeGreaterThan(0)
  expect(new Set(levels)).toEqual(new Set(['Advanced']))
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
  await expect(page.getByLabel('Level', { exact: true })).toContainText('Any level')
})

test('a topic saved under an old label is ignored instead of hiding every rep', async ({ page }) => {
  await page.goto('/#/practice')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:default:catalogSkill', 'Practical concepts'))
  await page.reload()
  await expect(page.locator('#catalog-pane-title')).toHaveText('Start here')
  await expect(page.locator('.catalog-list .list-row').first()).toBeVisible()
})
