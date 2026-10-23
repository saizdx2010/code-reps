import { catalogAreas, catalogTopic } from '../../src/catalog-labels'
import { repLevel } from '../../src/rep-levels'
import { expect, test } from '@playwright/test'
import { reps } from '../../src/rep'
import { diagnosticRepIds } from '../../src/fluency'
import { expectChecksFinished, chooseOption, editor, replaceCode, route, solution } from './helpers'

test('focused writing steps preserve the real editor and hide unrelated forms', async ({ page }) => {
  await page.goto(route)
  await expect(editor(page)).toBeVisible()
  for (const menu of ['.site-menu', '.workspace-options']) {
    await page.locator(`${menu} > summary`).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator(menu)).toHaveAttribute('open', '')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Escape')
    await expect(page.locator(menu)).not.toHaveAttribute('open', '')
    await expect(page.locator(`${menu} > summary`)).toBeFocused()
  }
  await expect(page.getByLabel('Your plan', { exact: true })).not.toBeVisible()
  await expect(page.getByLabel('Your explanation', { exact: true })).not.toBeVisible()
  await expect(page.getByLabel('What was hardest?', { exact: true })).not.toBeVisible()
  await replaceCode(page, solution)
  await editor(page).press('ArrowDown')
  const cursor = await page
    .locator('.monaco-editor .cursor')
    .first()
    .evaluate(element => ({ top: (element as HTMLElement).style.top, left: (element as HTMLElement).style.left }))
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Count values and use the smaller value to resolve a tie.')
  await expect(editor(page)).toBeVisible()
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByLabel('Your explanation', { exact: true }).fill('Counts identify the most frequent value.')
  await expect(page.getByLabel('Your plan', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: 'Solve', exact: true }).click()
  await expect(page.getByLabel('Your explanation', { exact: true })).not.toBeVisible()
  expect(
    await page
      .locator('.monaco-editor .cursor')
      .first()
      .evaluate(element => ({ top: (element as HTMLElement).style.top, left: (element as HTMLElement).style.left })),
  ).toEqual(cursor)
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: /^Checks/ }).click()
  await expect(page.getByText('All checks passed', { exact: true })).not.toBeVisible()
  await page.getByRole('button', { name: /^Checks/ }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue(/Count values/)
})

test('a fresh load starts at the skip link, and in-app navigation moves focus to the page heading', async ({ page }) => {
  await page.goto('/#/home')
  // Wait for the app itself: index.html's startup screen has its own h1, and React replaces it (dropping any focus) on mount.
  await expect(page.locator('.startup-loading')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The first Tab from a fresh load reaches the skip link before the header; the heading is not focused on load.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await expect(page.getByRole('heading', { level: 1 })).not.toBeFocused()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('heading', { level: 1 })).not.toBeFocused()
})

test('a slow lazy page still hands focus to its heading after the loading heading is replaced', async ({ page }) => {
  // Hold the Progress module longer than any fixed settle window so a busy machine's late arrival is reproduced.
  await page.route(/\/src\/ProgressPage\.tsx/, async route => {
    await new Promise(resolve => setTimeout(resolve, 7000))
    await route.continue()
  })
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Opening your skills' })).toBeVisible()
  await expect(page.locator('main:not([aria-busy="true"]) h1')).toBeFocused({ timeout: 15000 })
})

test('grouped navigation supports direct links, refresh, and Back and Forward', async ({ page }) => {
  await page.goto('/#/home')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Shift+Tab from the brand reaches the skip link; Enter on it moves focus to the heading.
  await page.getByRole('button', { name: 'Code Reps home', exact: true }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  const main = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(main.getByRole('button')).toHaveText(['Trail', 'Library', 'Progress'])
  await main.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('navigation', { name: 'Library pages' }).getByRole('button', { name: 'Projects', exact: true }).click()
  await expect(page).toHaveURL(/#\/projects$/)
  await page.reload()
  await expect(main.getByRole('button', { name: 'Library', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('navigation', { name: 'Library pages' }).getByRole('button')).toHaveText(['Exercises', 'Lessons', 'Projects'])
  await page.getByRole('button', { name: 'Timed interview practice' }).click()
  await expect(
    page.getByRole('navigation', { name: 'Library pages' }).getByRole('button', { name: 'Projects', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await chooseOption(page.getByLabel('Interview focus', { exact: true }), 'interview-backend')
  await page.goBack()
  await expect(page).toHaveURL(/#\/projects$/)
  await page.goForward()
  await expect(page.getByLabel('Interview focus', { exact: true })).toHaveAttribute('data-value', 'interview-backend')
  await main.getByRole('button', { name: 'Progress', exact: true }).click()
  await page.getByRole('navigation', { name: 'Progress pages' }).getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page).toHaveURL(/#\/history$/)
  await page.getByRole('group', { name: 'Journal' }).getByRole('button', { name: 'Notebook', exact: true }).click()
  await expect(page).toHaveURL(/#\/notebook$/)
  await page.reload()
  await expect(main.getByRole('button', { name: 'Progress', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(
    page.getByRole('navigation', { name: 'Progress pages' }).getByRole('button', { name: 'Journal', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('group', { name: 'Journal' }).getByRole('button', { name: 'Notebook', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.goBack()
  await expect(page).toHaveURL(/#\/history$/)
  await page.goForward()
  await main.getByRole('button', { name: 'Trail', exact: true }).click()
  await page.getByRole('navigation', { name: 'Trail pages' }).getByRole('button', { name: 'All tracks', exact: true }).click()
  await expect(page).toHaveURL(/#\/paths$/)
  await page.goBack()
  await expect(page).toHaveURL(/#\/home$/)
  await main.getByRole('button', { name: 'Progress', exact: true }).click()
  await expect(page.getByRole('navigation', { name: 'Progress pages' }).getByRole('button')).toHaveText(['Skills', 'Journal'])
  await page.getByRole('button', { name: 'Take the self-assessment', exact: true }).click()
  await expect(page).toHaveURL(/#\/assessment$/)
  await expect(page.getByRole('button', { name: 'Start assessment', exact: true })).toBeVisible()
})

test('all product pages fit a narrow screen and lessons open without the topic list', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  for (const view of [
    'home',
    'practice',
    'paths',
    'knowledge',
    'notebook',
    'plan',
    'projects',
    'interview',
    'request-console',
    'assessment',
    'progress',
    'history',
    'learn',
  ]) {
    await page.goto(`/#/${view}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), view).toBe(true)
    await expect(page.getByText('Saved in browser', { exact: true })).toBeVisible()
  }
  await page.goto('/#/knowledge')
  await expect(page.getByLabel('Find a lesson', { exact: true })).not.toBeVisible()
  await page.locator('.knowledge-browser > summary').click()
  await page.getByLabel('Find a lesson', { exact: true }).fill('Cancellation and race conditions')
  await page.getByRole('button', { name: 'Cancellation and race conditions', exact: true }).click()
  await expect(page.getByLabel('Find a lesson', { exact: true })).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cancellation and race conditions', exact: true })).toBeVisible()
})

test('exercise topics follow the areas in learning order, easiest first, and reveal search matches', async ({ page }) => {
  await page.goto('/#/practice')
  const topicNames = page.locator('.catalog-rail-group:has(h2) button strong')
  await expect(topicNames.first()).toBeVisible()
  // Topics follow the areas in learning order, not the alphabet.
  const topics = new Set(reps.map(catalogTopic))
  expect(await topicNames.allTextContents()).toEqual(catalogAreas.flatMap(area => area.topics).filter(topic => topics.has(topic)))
  const first = page.locator('.catalog-rail-group:has(h2) button').first()
  const topic = await first.locator('strong').innerText()
  await first.click()
  await expect(page.locator('.catalog-list .list-row > button').first()).toBeVisible()
  // Easiest first within a topic; equal levels keep catalog order.
  expect(await page.locator('.catalog-list .list-row-text strong').allTextContents()).toEqual(
    reps
      .filter(rep => catalogTopic(rep) === topic)
      .sort((a, b) => (repLevel(a.id) ?? 4) - (repLevel(b.id) ?? 4))
      .map(rep => rep.title),
  )
  await page.getByLabel('Find a rep', { exact: true }).fill('stock adjustment')
  await expect(page.locator('.catalog-list .list-row > button')).toHaveCount(1)
  await expect(page.locator('#catalog-pane-title')).toHaveText('Search results')
  await page.getByRole('button', { name: 'Clear Find a rep', exact: true }).click()
  await expect(page.locator('#catalog-pane-title')).toHaveText(topic)
})

test('assessment topics disclose skill evidence and preserve the assessment flow', async ({ page }) => {
  await page.goto('/#/assessment')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.locator('.hub-evidence .list-group[open]')).toHaveCount(0)
  const group = page.locator('.hub-evidence .list-group').first()
  await group.locator(':scope > summary').focus()
  await page.keyboard.press('Enter')
  const skill = group.locator('.evidence-card').first()
  await skill.locator('summary').click()
  await expect(skill.getByRole('button', { name: 'Review your progress' })).toBeVisible()
  await page.getByRole('button', { name: 'Start assessment', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Start a new assessment', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try from a fresh start' })).toHaveCount(diagnosticRepIds.length)
  await skill.getByRole('button', { name: 'Review your progress' }).click()
  await expect(page).toHaveURL(/#\/knowledge/)
  await expect(page.locator('.knowledge-article h2').first()).toBeVisible()
})
