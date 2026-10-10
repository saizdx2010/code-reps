import { expect, test } from '@playwright/test'
import { route, replaceCode } from './helpers'

test('moving practice indicator follows the selected step across layouts without losing writing', async ({ page }) => {
  await page.goto(route)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Keep the counts separate from the tie-breaking decision.')
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    await expect.poll(() => page.locator('.practice-steps').evaluate(element => {
      const selected = element.querySelector('button[aria-current=step]')!.getBoundingClientRect()
      const indicator = element.querySelector('.step-indicator')!.getBoundingClientRect()
      return Math.abs(selected.left - indicator.left) < 1 && Math.abs(selected.top - indicator.top) < 1 && Math.abs(selected.width - indicator.width) < 1 && Math.abs(selected.height - indicator.height) < 1
    })).toBe(true)
  }
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Keep the counts separate from the tie-breaking decision.')
  await expect(page.getByRole('region', { name: 'Task and plan' })).toBeVisible()
})

test('reduced motion keeps buttons and dialogs usable without animated feedback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/home')
  const action = page.locator('.continue-panel .primary-button')
  await action.hover()
  expect(await action.evaluate(element => getComputedStyle(element).transform)).toBe('none')
  await page.getByRole('button', { name: 'Manage profiles' }).click()
  const dialog = page.getByRole('dialog', { name: 'Local profiles' })
  await expect(dialog).toBeVisible()
  expect(await dialog.evaluate(element => element.getAnimations().length)).toBe(0)
  await dialog.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await action.click()
  await expect(page).toHaveURL(/#\/practice\//)
  expect(await page.locator('.button-ripple').count()).toBe(0)
})

test('a cold learning route replaces the loading view with a usable lesson and leaves focus at the top', async ({ page }) => {
  await page.goto('/#/knowledge')
  const heading = page.getByRole('heading', { name: 'Learn a concept.', exact: true })
  await expect(heading).toBeVisible()
  // A page load does not move focus to the heading; the first Tab reaches the skip link.
  await expect(heading).not.toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.getByRole('button', { name: 'Predict', exact: true }).click()
  await expect(page.locator('.lesson-navigation button[aria-current]')).toHaveText('Predict')
  await expect.poll(() => page.locator('.lesson-navigation').evaluate(element => {
    const selected = element.querySelector('button[aria-current]')!.getBoundingClientRect()
    const indicator = element.querySelector('.step-indicator')!.getBoundingClientRect()
    return Math.abs(selected.left - indicator.left) < 1 && Math.abs(selected.width - indicator.width) < 1
  })).toBe(true)
})

test('dark mode follows the system, persists across refresh, and covers narrow pages', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/#/home')
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true })
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(25, 37, 31)')
  await toggle.focus()
  await toggle.press('Enter')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await page.setViewportSize({ width: 320, height: 568 })
  for (const route of ['knowledge', 'progress', 'notebook', 'practice', 'practice/most-frequent-number']) {
    await page.goto(`/#/${route}`)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  }
})

test('colour schemes work with both modes and restore before external assets load', async ({ page }) => {
  await page.goto('/#/home')
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Appearance', exact: true })
  for (const [name, palette, light, dark] of [
    ['Sage', 'sage', 'rgb(240, 244, 237)', 'rgb(25, 37, 31)'],
    ['Ocean', 'ocean', 'rgb(238, 244, 248)', 'rgb(23, 37, 47)'],
    ['Plum', 'plum', 'rgb(245, 240, 245)', 'rgb(42, 30, 41)'],
  ]) {
    await dialog.getByRole('radio', { name, exact: true }).check()
    await expect(page.locator('html')).toHaveAttribute('data-palette', palette)
    const logoPath = palette === 'sage' ? '/favicon.svg' : `/favicon-${palette}.svg`
    await expect(page.locator('.brand-mark')).toHaveAttribute('src', logoPath)
    await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', logoPath)
    await expect.poll(() => page.locator('.brand-mark').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    await expect(page.locator('html')).toHaveCSS('background-color', light)
    await dialog.getByRole('button', { name: 'Dark mode', exact: true }).click()
    await expect(page.locator('html')).toHaveCSS('background-color', dark)
    await dialog.getByRole('button', { name: 'Dark mode', exact: true }).click()
  }
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  await dialog.getByRole('button', { name: 'Dark mode', exact: true }).click()
  await page.route('**/*', route => ['stylesheet', 'script'].includes(route.request().resourceType()) ? route.abort() : route.continue())
  await page.reload()
  await expect(page.locator('.startup-loading')).toHaveCSS('background-color', 'rgb(42, 30, 41)')
  await expect(page.locator('.startup-brand .logo-plum')).toBeVisible()
  await expect(page.locator('.startup-brand .logo-sage')).toBeHidden()
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/favicon-plum.svg')
})

test('switching schemes recolours the live coding desk without replacing learner code', async ({ page }) => {
  await page.goto(route)
  await replaceCode(page, '// Keep this draft through colour changes\nfunction mostFrequent(numbers: number[]): number | null { return null }')
  const originalEditor = await page.locator('.monaco-editor').first().elementHandle()
  await page.getByRole('button', { name: 'Appearance', exact: true }).click()
  for (const [name, background, action] of [
    ['Ocean', 'rgb(33, 52, 66)', 'rgb(151, 217, 245)'],
    ['Plum', 'rgb(58, 43, 57)', 'rgb(237, 185, 227)'],
    ['Sage', 'rgb(48, 63, 56)', 'rgb(188, 229, 123)'],
  ]) {
    await page.getByRole('radio', { name, exact: true }).check()
    await expect(page.locator('.code-column')).toHaveCSS('background-color', background)
    await expect(page.locator('.monaco-editor').first()).toHaveCSS('background-color', background)
    await expect(page.getByRole('button', { name: 'Run checks', exact: true })).toHaveCSS('background-color', action)
    await expect(page.locator('.view-lines')).toContainText('Keep this draft through colour changes')
    expect(await originalEditor!.evaluate(element => element.isConnected)).toBe(true)
  }
})

test('dark startup renders before external assets and respects an explicit light choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.route('**/*', route => ['stylesheet', 'script'].includes(route.request().resourceType()) ? route.abort() : route.continue())
  await page.goto('/#/home')
  await expect(page.locator('.startup-loading')).toHaveCSS('background-color', 'rgb(25, 37, 31)')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:device:theme', 'light'))
  await page.reload()
  await expect(page.locator('.startup-loading')).toHaveCSS('background-color', 'rgb(240, 244, 237)')
})

test('rapid practice tab selection settles on the last pane without losing a plan', async ({ page }) => {
  await page.goto('/#/practice/most-frequent-number')
  const tabs = page.locator('.practice-steps')
  await tabs.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Count each value and resolve ties in encounter order.')
  await tabs.evaluate(element => {
    for (const name of ['Understand', 'Explain', 'Review', 'Plan']) {
      Array.from(element.querySelectorAll('button')).find(button => button.getAttribute('aria-label') === name)?.click()
    }
  })
  await expect(tabs.getByRole('button', { name: 'Plan', exact: true })).toHaveAttribute('aria-current', 'step')
  await expect(page.locator('#plan-section')).toBeFocused()
  await expect(page.getByLabel('Your plan', { exact: true })).toHaveValue('Count each value and resolve ties in encounter order.')
  await expect(page.locator('#review-section')).toBeHidden()
})

test('lesson section tabs preserve scroll and keyboard focus', async ({ page }) => {
  await page.goto('/#/knowledge')
  const tabs = page.getByRole('navigation', { name: 'Lesson sections' })
  const predict = tabs.getByRole('button', { name: 'Predict', exact: true })
  await predict.scrollIntoViewIfNeeded()
  const scroll = await page.evaluate(() => window.scrollY)
  await predict.click()
  await expect(predict).toHaveAttribute('aria-current', 'location')
  await expect(predict).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll)
  const practise = tabs.getByRole('button', { name: 'Practice', exact: true })
  await practise.focus()
  await practise.press('Enter')
  await expect(practise).toHaveAttribute('aria-current', 'location')
  await expect(practise).toBeFocused()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scroll)
})

test('lesson and path completion rows respond in place without moving their layout', async ({ page }) => {
  await page.goto('/#/knowledge')
  const row = page.locator('.knowledge-topic-list button').first()
  await row.hover()
  await expect.poll(() => row.evaluate(element => getComputedStyle(element).transform)).toBe('none')
  expect(await row.evaluate(element => getComputedStyle(element).boxShadow)).toBe('none')
  await page.goto('/#/practice')
  await page.locator('.catalog-list .list-group summary').first().click()
  await expect.poll(() => page.locator('main').evaluate(element => element.getAnimations().length)).toBe(0)
  const card = page.locator('.catalog-list .list-group[open] .list-row > button').first()
  const next = page.locator('.catalog-list .list-group[open] .list-row > button').nth(1)
  // Bring both rows into view so focus does not scroll the page.
  await next.scrollIntoViewIfNeeded()
  await expect.poll(() => page.locator('main').evaluate(element => element.getAnimations().length)).toBe(0)
  const nextPosition = await next.boundingBox()
  await card.hover()
  await expect.poll(() => card.evaluate(element => getComputedStyle(element).transform)).toBe('none')
  await expect.poll(() => card.locator('.icon-arrow').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
  await card.focus()
  await expect(card).toBeFocused()
  expect(await next.boundingBox()).toEqual(nextPosition)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe('none')
})

test('a progress disclosure visibly collapses and reverses without losing its actions', async ({ page }) => {
  await page.goto('/#/progress')
  const disclosure = page.locator('.progress-journey').first()
  const summary = disclosure.locator('summary')
  await summary.click()
  await expect(disclosure.getByRole('button', { name: 'Open rep', exact: true })).toBeVisible()
  await expect.poll(() => disclosure.evaluate(element => getComputedStyle(element, '::details-content').opacity)).toBe('1')
  const expanded = await disclosure.evaluate(element => element.getBoundingClientRect().height)
  const collapsed = await summary.evaluate(element => element.getBoundingClientRect().height)
  await summary.click()
  await expect(disclosure).not.toHaveAttribute('open', '')
  await expect.poll(async () => {
    const height = await disclosure.evaluate(element => element.getBoundingClientRect().height)
    return height < expanded - 4 && height > collapsed + 4
  }, { intervals: [16] }).toBe(true)
  await summary.click()
  await expect(disclosure).toHaveAttribute('open', '')
  await expect(disclosure.getByRole('button', { name: 'Open rep', exact: true })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await summary.click()
  await expect(disclosure).not.toHaveAttribute('open', '')
  await expect(disclosure.getByRole('button', { name: 'Open rep', exact: true })).not.toBeVisible()
})

test('startup workbook is styled before external styles and JavaScript arrive', async ({ page }) => {
  await page.route('**/*', route => ['stylesheet', 'script'].includes(route.request().resourceType()) ? route.abort() : route.continue())
  await page.goto('/#/home')
  const startup = page.locator('.startup-loading')
  await expect(startup).toBeVisible()
  await expect(startup).toHaveCSS('background-color', 'rgb(240, 244, 237)')
  await expect(startup.locator('.startup-sheet')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(startup.locator('.skeleton-title')).toHaveCSS('height', '28px')
  await page.setViewportSize({ width: 320, height: 568 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
})

test('startup progress loading uses the light workbook before storage is ready', async ({ page }) => {
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/api/state', async request => { await pending; await request.continue() })
  try {
    await page.goto('/#/home')
    await expect(page.locator('.startup-loading')).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Loading your local progress…')
    expect(await page.locator('.startup-loading').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(240, 244, 237)')
    await page.setViewportSize({ width: 320, height: 800 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  } finally { release() }
  await expect(page.locator('.startup-loading')).not.toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('each pending learning page keeps its own heading and working surface', async ({ context }) => {
  const pages = [
    ['knowledge', 'Learn a concept.', '.loading-lesson-layout', '.loading-lesson-layout > .loading-sheet', '.knowledge-article'],
    ['notebook', 'Your notebook.', '.loading-notebook-surface', '.loading-notebook-heading', '.hub-heading'],
    ['plan', 'Make room for practice.', '.loading-week', '.loading-sheet', '.hub-panel'],
    ['assessment', 'Find your starting point.', '.loading-rows', '.loading-sheet', '.hub-panel'],
    ['projects', 'Put your skills together.', '.loading-rows', 'h2', '#browser-project-heading'],
    ['interview', 'Practice an interview.', '.loading-interview-sheet', '.loading-sheet', '.hub-panel'],
  ]
  for (const [route, title, surface, pendingSurface, loadedSurface] of pages) {
    const page = await context.newPage()
    let release!: () => void
    const pending = new Promise<void>(resolve => { release = resolve })
    let pendingTop = 0
    let desktopPendingTop = 0
    await page.route('**/src/LearningHub.tsx*', async request => { await pending; await request.continue() })
    try {
      await page.goto(`/#/${route}`)
      const loading = page.locator(`.loading-${route}`)
      await expect(loading).toBeVisible()
      await expect(loading.getByRole('heading', { level: 1 })).toHaveText(title)
      await expect(loading.locator(surface)).toBeVisible()
      await expect.poll(() => loading.evaluate(element => element.getAnimations().length)).toBe(0)
      desktopPendingTop = await loading.locator(pendingSurface).first().evaluate(element => element.getBoundingClientRect().top)
      if (route === 'notebook') expect(await loading.locator('.skeleton-writing').count()).toBe(0)
      await page.setViewportSize({ width: 320, height: 800 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
      await expect.poll(() => loading.evaluate(element => element.getAnimations().length)).toBe(0)
      pendingTop = await loading.locator(pendingSurface).first().evaluate(element => element.getBoundingClientRect().top)
    } finally { release() }
    await expect(page.locator('.page-loading')).not.toBeVisible()
    // A cold load does not move focus to the heading; in-app navigation does.
    await expect(page.getByRole('heading', { name: title, exact: true })).not.toBeFocused()
    await expect(page.locator('.learning-hub').locator(loadedSurface).first()).toBeVisible()
    await expect.poll(() => page.locator('.learning-hub').evaluate(element => element.getAnimations().length)).toBe(0)
    const loadedTop = await page.locator('.learning-hub').locator(loadedSurface).first().evaluate(element => element.getBoundingClientRect().top)
    expect(Math.abs(loadedTop - pendingTop), `${route} working surface should not jump when loading ends`).toBeLessThan(2)
    await page.setViewportSize({ width: 1280, height: 900 })
    const desktopLoadedTop = await page.locator('.learning-hub').locator(loadedSurface).first().evaluate(element => element.getBoundingClientRect().top)
    expect(Math.abs(desktopLoadedTop - desktopPendingTop), `${route} desktop surface should not jump when loading ends`).toBeLessThan(2)
    await page.close()
  }
})

test('notebook loading reserves an existing writing draft and preserves it after loading', async ({ page }) => {
  await page.goto('/#/notebook')
  await page.getByRole('button', { name: 'New entry', exact: true }).click()
  await page.getByLabel('Title', { exact: true }).fill('Keep loading shapes stable')
  await page.getByLabel('What you learned', { exact: true }).fill('A skeleton should reserve the real working surface.')
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route('**/src/LearningHub.tsx*', async request => { await pending; await request.continue() })
  try {
    await page.reload()
    await expect(page.locator('.loading-notebook .skeleton-writing')).toBeVisible()
    expect(await page.locator('.loading-notebook').getByRole('textbox').count()).toBe(0)
  } finally { release() }
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Keep loading shapes stable')
  await expect(page.getByRole('textbox', { name: 'What you learned', exact: true })).toHaveValue('A skeleton should reserve the real working surface.')
})

test('journal switch indicator settles behind the selected view', async ({ page }) => {
  await page.goto('/#/history')
  const group = page.getByRole('group', { name: 'Journal' })
  const mistakes = group.getByRole('button', { name: 'Mistakes', exact: true })
  await mistakes.focus()
  await mistakes.press('Enter')
  await expect(page).toHaveURL(/#\/mistakes$/)
  await expect(mistakes).toHaveAttribute('aria-pressed', 'true')
  const fill = group.locator('.step-indicator')
  await expect.poll(async () => {
    const [selected, indicator] = await Promise.all([mistakes.boundingBox(), fill.boundingBox()])
    return Math.abs(selected!.x - indicator!.x) < 1 && Math.abs(selected!.width - indicator!.width) < 1
  }).toBe(true)
  await expect(mistakes).toHaveCSS('transform', 'none')
  await page.goto('/#/paths')
  await expect(page).toHaveURL(/#\/paths$/)
})

test('utility drawers retain their exit and restore keyboard focus', async ({ page }) => {
  await page.goto(route)
  const glossary = page.getByRole('button', { name: 'Glossary', exact: true })
  await glossary.click()
  const drawer = page.getByRole('dialog', { name: 'Quick glossary' })
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: 'Close Quick glossary' }).click()
  await expect(glossary).toBeFocused()
  await expect(page.locator('.glossary-drawer')).toHaveCount(0)
  await page.keyboard.press('ControlOrMeta+K')
  const commands = page.getByRole('dialog', { name: 'Commands & exercises' })
  await expect(commands).toBeVisible()
  await page.getByRole('combobox', { name: 'Search or choose an action' }).fill('Home')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/home$/)
  await expect(page.locator('.utility-dialog')).toHaveCount(0)
})

test('every page shares one frame, type scale, and control height', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const route of ['home', 'paths', 'plan', 'practice', 'knowledge', 'projects', 'interview', 'progress', 'history', 'sessions', 'notebook', 'assessment', 'learn']) {
    await page.goto(`/#/${route}`)
    // Wait past the startup shell and any lazy page placeholder for the loaded page header.
    await expect(page.locator('main .page-header h1')).toBeVisible()
    await expect(page.locator('.page-loading')).toHaveCount(0)
    const frame = await page.evaluate(() => {
      const h1 = document.querySelector('main h1')!
      const tab = document.querySelector('.section-nav button')!
      const controls = [...document.querySelectorAll<HTMLElement>('main .ui-input:not(textarea), main .ui-select, main .primary-button, main .reset-button')]
        // Rows and tab bars reuse button styles with their own geometry; only standalone controls share the height.
        .filter(element => element.getBoundingClientRect().height > 0 && !element.closest('nav, .knowledge-topic-list, .lesson-navigation'))
        .map(element => Math.round(element.getBoundingClientRect().height))
      return { h1Left: Math.round(h1.getBoundingClientRect().left), tabLeft: Math.round(tab.getBoundingClientRect().left), size: getComputedStyle(h1).fontSize, controls }
    })
    expect(frame.h1Left, `${route} heading aligns with section tabs`).toBe(frame.tabLeft)
    expect(frame.size, `${route} page title size`).toBe('32px')
    for (const height of frame.controls) expect(height, `${route} control height`).toBe(40)
  }
})
