import { expect, test } from '@playwright/test'
import { chooseTrack } from './helpers'
import { dsaSkills } from '../../src/dsa-knowledge'

for (const width of [1280, 390]) {
  test(`recognition track and checked lesson remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/paths')
    await chooseTrack(page, 'pattern-recognition')
    await expect(page.locator('#path-title')).toHaveText('Pattern Recognition')
    // The introduction starts folded so the trail is in reach; it opens on request.
    await page.locator('.path-intro-details > summary').click()
    await expect(page.getByRole('heading', { name: 'See the shape, then solve the problem' })).toBeVisible()
    await page.reload()
    await expect(page.locator('#path-title')).toHaveText('Pattern Recognition')
    await page.goto('/#/knowledge')
    const browser = page.locator('.knowledge-browser')
    if ((await browser.getAttribute('open')) === null) await browser.locator(':scope > summary').click()
    await page.getByRole('searchbox', { name: 'Find a lesson' }).fill('Recognize the pattern')
    await page.getByRole('button', { name: 'Recognize the pattern', exact: true }).click()
    const discussion = page.locator('.knowledge-article details.reasoning-compare')
    await expect(discussion.locator('summary')).toHaveText('Show the discussion (write yours first to compare)')
    await expect(discussion).not.toHaveAttribute('open', '')
    await discussion.locator('summary').click()
    await expect(discussion).toHaveAttribute('open', '')
    await page.getByRole('navigation', { name: 'Lesson sections' }).getByRole('button', { name: 'Predict', exact: true }).click()
    const lesson = dsaSkills.find(skill => skill.id === 'recognize-the-pattern')!
    for (const question of lesson.questions) {
      const field = page.getByRole('group', { name: question.prompt, exact: true })
      await field.getByRole('radio', { name: question.options[question.answer], exact: true }).check()
      await field.getByRole('button', { name: 'Check prediction' }).click()
      await expect(field.getByRole('status')).toContainText('Correct prediction.')
    }
    await page.reload()
    await expect(page.locator('.lesson-feedback[data-state="success"]')).toHaveCount(lesson.questions.length)
    await page.getByRole('navigation', { name: 'Lesson sections' }).getByRole('button', { name: 'Practice', exact: true }).click()
    await page.locator('#lesson-practise .list-row button').first().click()
    await expect(page).toHaveURL(/practice\/algo-sorted-pair/)
    if (width < 900) await page.getByRole('button', { name: 'Solve', exact: true }).click()
    await expect(page.getByRole('textbox', { name: /^TypeScript solution for/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
