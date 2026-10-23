import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { paths } from '../../src/path'
import { chooseSegment, expectChecksFinished, replaceCode, route, solution } from './helpers'

const day = 86_400_000
/** Noon on the local calendar day a given number of days ago, so records land on their intended day; never in the future. */
const ago = (days: number) => {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  return new Date(Math.min(date.getTime() - days * day, Date.now() - 60_000)).toISOString()
}
const record = (repId: string, daysAgo: number, hintCount = 0, id = `${repId}-${daysAgo}`) => ({
  id,
  repId,
  completedAt: ago(daysAgo),
  plan: `Plan for ${repId}`,
  code: 'code',
  explanation: `Explanation for ${repId}`,
  hintCount,
  confidence: 'getting-there',
  difficulty: 'none',
})
const foundations = [...new Set(paths[0].stages.flatMap(stage => [...stage.repIds]))]

async function seed(page: Page, history: ReturnType<typeof record>[], learning?: object) {
  // Only this test's fresh browser context receives the sample history, with each completed draft saved as it would be.
  await page.goto('/#/home')
  await page.evaluate(
    ({ history, learning }) => {
      localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(history))
      for (const item of [...history].reverse()) {
        const { id: _id, repId, ...attempt } = item
        localStorage.setItem(`code-reps:profile:default:attempt:${repId}:v1`, JSON.stringify(attempt))
      }
      if (learning) localStorage.setItem('code-reps:profile:default:fluency:v1', JSON.stringify(learning))
    },
    { history, learning },
  )
  await page.reload()
}
const learning = (extra: object = {}) => ({
  version: 1,
  goal: { pathId: 'typescript', minutes: 20, days: [1, 3, 5] },
  answers: {},
  reviews: {},
  notes: [],
  bookmarks: [],
  rounds: [],
  ...extra,
})

/** Completes "Find the most frequent number" through the workspace, without hints. */
async function completeMostFrequent(page: Page) {
  await page.goto(route)
  const steps = page.getByRole('navigation', { name: 'Practice steps' })
  await steps.getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Count occurrences and choose the smaller number when counts tie.')
  await steps.getByRole('button', { name: 'Solve', exact: true }).click()
  await replaceCode(page, solution)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await steps.getByRole('button', { name: 'Explain', exact: true }).click()
  await page
    .getByLabel('Your explanation', { exact: true })
    .fill('I count each value, compare counts, and use the smaller value to break ties. Empty input returns null.')
  await steps.getByRole('button', { name: 'Finish', exact: true }).click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
}

/** No milestone adds a storage key: the stage, track, and program are worked out from saved attempts. */
async function expectNoMilestoneStorage(page: Page) {
  // Session UI state (code-reps:ui:…) and per-page scroll memory (code-reps:screen:…) are existing mechanisms, never backed up.
  const keys = await page.evaluate(() => [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage).filter(key => !key.startsWith('code-reps:screen:')),
  ])
  expect(keys.filter(key => /milestone|closeout|finish|first-weeks|starter|program/i.test(key))).toEqual([])
}

test('finishing the last rep of a stage closes it in the completion panel, then folds it on Trail', async ({ page }) => {
  await seed(page, [record('has-duplicate', 3, 1), record('first-unique-character', 2)], learning())
  await completeMostFrequent(page)

  const block = page.locator('.completion-panel .closeout')
  await expect(block.locator('.closeout-label')).toHaveText('Stage 04 complete')
  await expect(block.getByRole('heading', { level: 4 })).toHaveText('Count and remember')
  // The authored recap, and the stage's skill with its evidence: a hint-free independent rep after the guided one.
  await expect(block).toContainText('You can now use maps and sets to remember values and look them up again.')
  await expect(block.getByRole('list', { name: 'Skills from this stage' }).locator('li')).toHaveText([/Count and remember\s*Independent/])
  // Reopening the finished rep shows the same close-out: it is worked out from the saved attempt.
  await page.reload()
  await page.getByRole('navigation', { name: 'Practice steps' }).getByRole('button', { name: 'Finish', exact: true }).click()
  await expect(block.locator('.closeout-label')).toHaveText('Stage 04 complete')
  await block.getByRole('button', { name: 'Start Stage 05: Handle text and gaps (first rep: Count words)' }).click()
  await expect(page).toHaveURL(/#\/practice\/count-words$/)

  await page.goto('/#/home')
  const stage = page.locator('.trail-stage', { has: page.getByRole('heading', { name: 'Count and remember', exact: true }) })
  await expect(stage).toHaveClass(/is-done/)
  const summary = stage.locator('summary')
  await expect(summary.locator('.trail-stage-finished')).toHaveText(/^Completed /)
  await expect(summary).toContainText('You can now use maps and sets')
  await expect(summary.locator('.trail-stage-count')).toHaveText('3 reps')
  await expect(stage.locator('details')).not.toHaveAttribute('open')
  await summary.click()
  await expect(stage.locator('details')).toHaveAttribute('open', '')
  await expect(stage.locator('.trail-node')).toHaveCount(5)
  // The trail line through a finished stage is drawn solid, in the action colour of its completed markers.
  const colours = await stage.evaluate(element => ({
    line: getComputedStyle(element.querySelector('.trail-nodes')!, '::before').backgroundColor,
    marker: getComputedStyle(element.querySelector('.trail-node.is-done .trail-marker')!).backgroundColor,
  }))
  expect(colours.line).toBe(colours.marker)
  // A stage still in progress keeps its count and no date.
  const current = page.locator('.trail-stage.is-current')
  await expect(current.locator('.trail-stage-finished')).toHaveCount(0)
  await expectNoMilestoneStorage(page)
})

test('finishing a whole track shows Track complete instead, linking to its finish page under Progress', async ({ page }) => {
  const earlier = foundations
    .filter(id => id !== 'most-frequent-number')
    .map((id, index) => record(id, Math.max(1, 30 - Math.floor(index * 0.7)), index % 3 === 0 ? 1 : 0))
  const notes = [
    { id: 'lookup-note', title: 'Maps remember counts', body: 'Start each count at zero.', skillId: 'lookup', repId: '', kind: 'note' },
    { id: 'free-note', title: 'A note about nothing in particular', body: 'Unrelated.', skillId: '', repId: '', kind: 'note' },
  ].map(note => ({ ...note, updatedAt: ago(2) }))
  await seed(page, earlier, learning({ notes }))
  await completeMostFrequent(page)

  const block = page.locator('.completion-panel .closeout')
  await expect(block.locator('.closeout-label')).toHaveText('Track complete')
  await expect(block.getByRole('heading', { level: 4 })).toHaveText('Foundations')
  // One block, never the stage and the track together.
  await expect(page.locator('.completion-panel .closeout')).toHaveCount(1)
  await block.getByRole('button', { name: 'See your Foundations finish' }).click()

  await expect(page).toHaveURL(/#\/finished\/typescript$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Foundations')
  await expect(page.locator('.section-nav [aria-current="page"], .section-nav .active').first()).toBeVisible()
  const facts = page.getByRole('definition')
  await expect(page.locator('.finish-facts dt')).toHaveText(['Started', 'Finished', 'Days taken', 'Practice days'])
  await expect(facts.nth(0)).toContainText(
    new Date(ago(30)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
  )
  await expect(facts.nth(1)).toContainText('Find the most frequent number')
  await expect(facts.nth(2)).toContainText('31 days')
  // First and last rep, side by side: writing and evidence, since they are different reps.
  const firstLast = page.locator('.first-last')
  await expect(firstLast.locator('.then-now-then')).toContainText('Declare a value')
  await expect(firstLast.locator('.then-now-then')).toContainText('1 hint')
  await expect(firstLast.locator('.then-now-now')).toContainText('Find the most frequent number')
  await expect(firstLast.locator('.then-now-now')).toContainText('No hints')
  await expect(firstLast.locator('.then-now-now')).toContainText('Count occurrences and choose the smaller number')
  await expect(page.locator('.finish-skills li', { hasText: 'Count and remember' })).toContainText('Independent')
  await expect(page.locator('.finish-notes li')).toHaveText([/Maps remember counts/])
  await expect(page.locator('.finish-badges > li').first()).toContainText('Foundations track')
  await expect(page.locator('.finish-badges > li', { hasText: 'Count and remember' })).toContainText('Earned')

  // The page is bookmarkable and Back and Forward move through it.
  await page.goBack()
  await expect(page).toHaveURL(/#\/practice\/most-frequent-number$/)
  await page.goForward()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Foundations')
  await page.reload()
  await expect(page.locator('.first-last')).toBeVisible()

  // Skills lists the finished track, with a link back to its page.
  await page.getByRole('button', { name: 'Back to Skills' }).click()
  await expect(page).toHaveURL(/#\/progress$/)
  const finished = page.getByRole('region', { name: 'Finished tracks' })
  await expect(finished.locator('.list-row')).toHaveText([/Foundations.*Finished .* · 44 reps in 31 days\s*Finished/])
  await finished.getByRole('button', { name: /Foundations/ }).click()
  await expect(page).toHaveURL(/#\/finished\/typescript$/)

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await expectNoMilestoneStorage(page)
})

test('a finish page for an unfinished or unknown track says so and leads somewhere useful', async ({ page }) => {
  await seed(page, [record('declare-variables', 2)])
  await page.goto('/#/finished/sql')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('SQL')
  await expect(page.locator('.empty-state')).toContainText('This track is not finished yet.')
  await page.getByRole('button', { name: 'Open SQL' }).click()
  await expect(page).toHaveURL(/#\/paths$/)
  await page.goto('/#/finished/not-a-track')
  await expect(page.locator('.empty-state')).toContainText('No track to show here.')
  await page.goto('/#/finished')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Skills')
  await expect(page.getByRole('region', { name: 'Finished tracks' })).toHaveCount(0)
})

test('checking every prediction closes the lesson with the first-check score and the rep to use it in next', async ({ page }) => {
  await seed(page, [record('declare-variables', 2)])
  await page.goto('/#/knowledge/values')
  await page.getByRole('navigation', { name: 'Lesson sections' }).getByRole('button', { name: 'Predict', exact: true }).click()
  const predict = page.locator('#lesson-predict')
  await expect(predict.getByRole('button', { name: /^Next: Practice/ })).toBeVisible()
  await expect(predict.locator('.lesson-closeout')).toHaveCount(0)
  const questions = predict.locator('.lesson-question')
  // One right, one wrong, as first checks.
  await questions.nth(0).locator('input[type=radio]').nth(1).check()
  await questions.nth(0).getByRole('button', { name: 'Check prediction' }).click()
  await expect(predict.locator('.lesson-closeout')).toHaveCount(0)
  await questions.nth(1).locator('input[type=radio]').nth(0).check()
  await questions.nth(1).getByRole('button', { name: 'Check prediction' }).click()

  const closeout = predict.locator('.lesson-closeout')
  await expect(closeout.getByRole('heading', { level: 4 })).toHaveText('1 of 2 predictions right on the first check')
  // One primary action: the first rep that uses the lesson and is not completed yet.
  await expect(predict.getByRole('button', { name: /^Next: Practice/ })).toHaveCount(0)
  await expect(closeout.locator('.primary-button')).toHaveText('Use it next: Use basic types')
  await expect(closeout).toContainText('Then Create an object and Read an array, and 1 more.')
  // A practice check after the first does not change the recorded score.
  await questions.nth(1).locator('input[type=radio]').nth(1).check()
  await questions.nth(1).getByRole('button', { name: 'Check again (practice)' }).click()
  await expect(closeout.getByRole('heading', { level: 4 })).toHaveText('1 of 2 predictions right on the first check')
  await closeout.getByRole('button', { name: 'Use it next: Use basic types' }).click()
  await expect(page).toHaveURL(/#\/practice\/basic-types$/)
  await page.getByRole('button', { name: 'Back to the lesson Values, types, and functions' }).click()
  await expect(page).toHaveURL(/#\/knowledge\/values$/)
})

test('the first four weeks run on Trail from the first completed rep, with a full page under Progress', async ({ page }) => {
  // A first rep nine days ago: week two of four.
  await seed(
    page,
    [record('declare-variables', 9), record('basic-types', 8, 1), record('make-arrays', 1)],
    learning({ answers: { 'values:return': { choice: 1, correct: true, answeredAt: ago(9) } } }),
  )
  const card = page.locator('.starter-card')
  await expect(card.getByRole('heading', { level: 2 })).toHaveText('Your first 4 weeks')
  await expect(card.locator('.today-plan-count')).toHaveText('Week 2 of 4')
  // Trail shows only this week's next target; the full list is on the page.
  const rows = card.getByRole('list', { name: 'Week 2: next target' }).locator('.list-row')
  await expect(rows).toHaveCount(1)
  await expect(rows.nth(0)).toContainText('Return from a function')
  await expect(rows.nth(0)).toContainText('Next this week · 1 of 4 done')
  await rows.nth(0).getByRole('button').click()
  await expect(page).toHaveURL(/#\/practice\/write-functions$/)

  await page.goto('/#/home')
  await card.getByRole('button', { name: 'See all four weeks' }).click()
  await expect(page).toHaveURL(/#\/first-weeks$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your first 4 weeks')
  const weeks = page.locator('.starter-weeks > .list-group')
  await expect(weeks).toHaveCount(4)
  await expect(weeks.nth(0).locator('summary')).toContainText('Week 1')
  await expect(weeks.nth(0).locator('summary')).toContainText('3 of 4 done')
  await expect(weeks.nth(1)).toHaveAttribute('open', '')
  await expect(weeks.nth(1).locator('summary')).toContainText('Week 2 · This week')
  // The reflection waits for the last week.
  await expect(page.locator('.starter-reflection')).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(/#\/home$/)
  await expectNoMilestoneStorage(page)
})

test('after week four the program shows its finish, saves the reflection as a Notebook note, then leaves Trail', async ({ page }) => {
  const history = [record('declare-variables', 30), record('basic-types', 26), record('create-objects', 20, 2)]
  await seed(page, history, learning())
  const card = page.locator('.starter-card')
  await expect(card.locator('.today-plan-count')).toHaveText('Finished')
  await expect(card.locator('.today-done')).toContainText('Four weeks done. 3 of 15 targets completed.')
  await card.getByRole('button', { name: 'Look back on your four weeks' }).click()
  await expect(page).toHaveURL(/#\/first-weeks$/)

  const reflection = page.locator('.starter-reflection')
  const save = reflection.getByRole('button', { name: 'Save to Notebook' })
  await expect(save).toBeDisabled()
  await reflection.getByLabel('What can you do now that you could not do four weeks ago?').fill('Name values and write small functions.')
  await reflection.getByLabel('What will you practice next?').fill('Loops and conditions.')
  await save.click()
  await expect(reflection.getByRole('status')).toContainText('Saved to your Notebook')
  await expect(reflection.locator('.starter-reflection-body')).toContainText(
    '3 of 15 targets done; 3 completed attempts on 3 days, 2 without hints.',
  )
  await expect(reflection.locator('.starter-reflection-body')).toContainText('What will you practice next?\nLoops and conditions.')
  // The reflection is an ordinary note; nothing else about the program is stored.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('code-reps:profile:default:fluency:v1')!).notes)
  expect(saved).toHaveLength(1)
  expect(saved[0]).toMatchObject({ kind: 'note', skillId: '', repId: '', title: expect.stringMatching(/^Your first 4 weeks · /) })
  await reflection.getByRole('button', { name: 'Open Notebook' }).click()
  await expect(page).toHaveURL(/#\/notebook$/)
  await expect(page.getByText(/^Your first 4 weeks · /).first()).toBeVisible()

  await page.goto('/#/home')
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.locator('.starter-card')).toHaveCount(0)
  await expectNoMilestoneStorage(page)
})

test('a learner whose first rep was more than five weeks ago does not see the program on Trail', async ({ page }) => {
  await seed(page, [record('declare-variables', 40), record('basic-types', 2)])
  await expect(page.locator('#continue-heading')).toBeVisible()
  await expect(page.locator('.today-plan, .warmup-panel').first()).toBeVisible()
  await expect(page.locator('.starter-card')).toHaveCount(0)
  // Its page under Progress stays, finished.
  await page.goto('/#/progress')
  await page.getByRole('button', { name: 'Your first 4 weeks' }).click()
  await expect(page).toHaveURL(/#\/first-weeks$/)
  await expect(page.locator('.starter-facts')).toContainText('Finished')
})
