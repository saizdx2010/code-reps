import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { backendSolutions } from '../fixtures/backend-solutions.mjs'
import { chooseOption, chooseSegment, chooseTrack, expectChecksFinished, replaceCode } from './helpers'

// The Request console runs the learner's saved Backend solutions; these records stand in for completed attempts, with
// the reference solutions from tests/fixtures as their code. Only this test's fresh browser context receives them.
const parsing = ['backend-request-line', 'backend-split-target', 'backend-decode-query', 'backend-header-value', 'backend-read-json-body']
const routing = ['backend-normalize-path', 'backend-match-route', 'backend-route-request']
const lastMark = `function splitTarget(target: string) {
  const mark = target.lastIndexOf('?')
  return mark < 0 ? { path: target || '/', query: '' } : { path: target.slice(0, mark) || '/', query: target.slice(mark + 1) }
}`
// Code takes longer than the console's five-second limit only while the worker loads.
const runTimeout = 30_000

async function seed(page: Page, repIds: string[], code: Record<string, string> = {}, to = '/#/request-console') {
  await page.goto('/#/home')
  await page.evaluate(
    records => localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(records)),
    [
      ...repIds.map((repId, index) => ({
        id: `${repId}-${index}`,
        repId,
        completedAt: new Date(Date.now() - (index + 1) * 60_000).toISOString(),
        plan: 'plan',
        code: code[repId] ?? backendSolutions[repId],
        explanation: 'explanation',
        hintCount: 0,
      })),
    ],
  )
  await page.goto(to)
  await page.reload()
}
const part = (page: Page, name: string) => page.locator('.console-part').filter({ has: page.getByRole('heading', { name, exact: true }) })
const send = (page: Page) => page.getByRole('button', { name: 'Send through your parts' }).click()

test('lit parts run the learner’s code and the request stops at the first part that is not lit', async ({ page }) => {
  await seed(page, parsing)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Request console')
  const flow = page.getByRole('region', { name: 'Your parts' })
  await expect(flow).toContainText('5 of 8 parts lit. 3 reps until requests reach a handler.')
  await expect(flow.locator('.console-part.is-lit')).toHaveCount(5)
  await expect(part(page, 'Path cleaning')).toContainText('Not lit')
  await expect(part(page, 'Path cleaning')).toContainText('Complete Clean a path before routing to light this part.')
  await send(page)
  await expect(flow.getByRole('status')).toHaveText('Stopped at path cleaning.', { timeout: runTimeout })
  await expect(part(page, 'Request line')).toContainText('Agrees')
  await expect(part(page, 'Request line')).toContainText('parseRequestLine("GET /orders?status=open&tag=gift&tag=sale HTTP/1.1")')
  // The repeated Accept headers reach the learner's headerValue and come back combined.
  await expect(part(page, 'Headers')).toContainText('headerValue(headers, "accept")')
  await expect(part(page, 'Headers')).toContainText('"text/html, application/json"')
  await expect(part(page, 'Path cleaning')).toContainText('The request stops here until this part is lit.')
  await expect(part(page, 'Route choice')).toContainText('Not reached')
  await expect(flow.locator('.console-response')).toHaveCount(0)
  // Nothing is locked: an unlit part leads to its rep.
  await part(page, 'Path cleaning').getByRole('button', { name: 'Open the rep' }).click()
  await expect(page).toHaveURL(/#\/practice\/backend-normalize-path$/)
})

test('with every part lit, requests reach a handler or a precise refusal, and the address keeps the page', async ({ page }) => {
  await seed(page, [...parsing, ...routing])
  const flow = page.getByRole('region', { name: 'Your parts' })
  await expect(flow).toContainText('All 8 parts lit, so requests reach a handler.')
  await chooseOption(page.getByRole('combobox', { name: 'Start from' }), { label: 'Create an order' })
  await send(page)
  await expect(flow.getByRole('status')).toHaveText('Answered 200 by create-order.', { timeout: runTimeout })
  const response = page.getByRole('region', { name: /200/ })
  await expect(response).toContainText('Handled by create-order')
  await expect(response).toContainText('{"sku":"A-7","quantity":2}')
  await expect(flow.locator('.console-part.is-agrees')).toHaveCount(8)
  await chooseOption(page.getByRole('combobox', { name: 'Start from' }), { label: 'The wrong method' })
  // Choosing another request clears the answer to the last one.
  await expect(flow.locator('.console-response')).toHaveCount(0)
  await send(page)
  await expect(flow.getByRole('status')).toHaveText('Answered 405 METHOD_NOT_ALLOWED.', { timeout: runTimeout })
  await expect(page.getByRole('region', { name: /405/ })).toContainText('Allowed here: DELETE, GET, HEAD.')
  // The page has its own address, and the typed request survives a refresh in this session.
  await page.getByLabel('Raw request').fill('GET /orders//42/./ HTTP/1.1\nHost: shop.local')
  await page.reload()
  await expect(page).toHaveURL(/#\/request-console$/)
  await expect(page.getByLabel('Raw request')).toHaveValue('GET /orders//42/./ HTTP/1.1\nHost: shop.local')
  await send(page)
  await expect(flow.getByRole('status')).toHaveText('Answered 200 by show-order.', { timeout: runTimeout })
  await expect(part(page, 'Path cleaning')).toContainText('normalizePath("/orders//42/./") returned "/orders/42"')
  await page.getByRole('button', { name: 'Back to Projects' }).click()
  await expect(page).toHaveURL(/#\/projects$/)
})

test('the first part that disagrees with its contract is named with both values, and the request stops there', async ({ page }) => {
  await seed(page, parsing, { 'backend-split-target': lastMark })
  await page.getByLabel('Raw request').fill('GET /search?q=a?b HTTP/1.1\nHost: shop.local')
  await expect(page.getByRole('combobox', { name: 'Start from' })).toContainText('Your own request')
  // From the request, the keyboard reaches Send next.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Send through your parts' })).toBeFocused()
  await page.keyboard.press('Enter')
  const flow = page.getByRole('region', { name: 'Your parts' })
  await expect(flow.getByRole('status')).toHaveText('Stopped at target split.', { timeout: runTimeout })
  const report = part(page, 'Target split').getByRole('alert')
  await expect(report).toContainText('Your splitTarget disagrees with its contract here.')
  await expect(report).toContainText('splitTarget("/search?q=a?b")')
  await expect(report).toContainText('{"path":"/search?q=a","query":"b"}')
  await expect(report).toContainText('{"path":"/search","query":"q=a?b"}')
  await expect(part(page, 'Query decoding')).toContainText('Not reached')
  await report.getByRole('button', { name: 'Open Split a request target' }).click()
  await expect(page).toHaveURL(/#\/practice\/backend-split-target$/)
})

test('a request the parts’ contracts do not cover is refused before anything runs', async ({ page }) => {
  await seed(page, parsing)
  await page.getByLabel('Raw request').fill('GET / HTTP/1.1\nno colon here')
  await send(page)
  await expect(page.getByRole('region', { name: 'Request', exact: true }).getByRole('alert')).toContainText('Line 2 is not a header.')
  await expect(page.getByLabel('Raw request')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('.console-part.is-agrees')).toHaveCount(0)
})

test('code that never finishes is stopped after five seconds and the console stays usable', async ({ page }) => {
  await seed(page, parsing, {
    'backend-split-target': 'function splitTarget(target: string) { while (true) {} return { path: target, query: "" } }',
  })
  const flow = page.getByRole('region', { name: 'Your parts' })
  await send(page)
  await expect(flow.getByRole('status')).toHaveText('Running your code…')
  // Editing the request stops the run at once instead of waiting out the limit.
  await page.getByLabel('Raw request').fill('GET /orders HTTP/1.1')
  await expect(page.getByRole('button', { name: 'Send through your parts' })).toBeEnabled({ timeout: 2_000 })
  await expect(flow.getByRole('alert')).toHaveCount(0)
  await send(page)
  await expect(flow.getByRole('alert')).toContainText('more than 5 seconds, so the console stopped it', { timeout: runTimeout })
  await expect(page.getByRole('button', { name: 'Send through your parts' })).toBeEnabled()
  await expect(flow.locator('.console-part.is-lit')).toHaveCount(5)
})

test('Backend trail stages, All tracks, and Projects show the console’s progress and open it', async ({ page }) => {
  await seed(page, parsing.slice(0, 3), {}, '/#/paths')
  await chooseTrack(page, 'backend')
  const line = 'Request console: 3 of 8 parts lit. 2 reps until requests parse.'
  const stage = page.locator('.path-stage').filter({ hasText: 'What a request is' })
  await expect(stage.locator('.stage-reward')).toContainText(line)
  // Only the two stages whose reps are parts show the line.
  await expect(page.locator('.stage-reward')).toHaveCount(2)
  await expect(page.locator('.path-stage').filter({ hasText: 'Check one value' }).locator('.stage-reward')).toHaveCount(0)
  await page.getByRole('button', { name: 'Use this as my learning goal' }).click()
  await page.getByRole('button', { name: 'Trail', exact: true }).click()
  const home = page.getByRole('region', { name: 'Learning goal' }).locator('.path-stage').filter({ hasText: 'What a request is' })
  await expect(home.locator('.stage-reward')).toContainText(line)
  await home.getByRole('button', { name: 'Open Request console' }).click()
  await expect(page).toHaveURL(/#\/request-console$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Request console')
  await page.goto('/#/projects')
  const card = page.getByRole('article', { name: 'Request console' })
  await expect(card).toContainText('Runs on your code · 3 of 8 parts lit')
  await expect(page.getByRole('article', { name: 'Game of Life' })).toBeVisible()
  await card.getByRole('button', { name: 'Open Request console' }).click()
  await expect(page).toHaveURL(/#\/request-console$/)
})

test('completing a part’s rep for the first time says which part it lit, once', async ({ page }) => {
  await seed(page, parsing.slice(0, 1), {}, '/#/practice/backend-split-target')
  await page.getByRole('button', { name: 'Plan', exact: true }).first().click()
  await page.getByLabel('Your plan', { exact: true }).fill('Find the first "?", slice on each side, and use "/" for an empty path.')
  await page.getByRole('button', { name: 'Solve', exact: true }).first().click()
  await replaceCode(page, backendSolutions['backend-split-target'], 'backend-split-target')
  await page
    .locator('.workspace-toolbar')
    .getByRole('button', { name: /Run checks/ })
    .click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).first().click()
  await page.getByLabel('Your explanation', { exact: true }).fill('indexOf finds the first mark, so a later "?" stays in the query.')
  await page.getByRole('button', { name: 'Finish', exact: true }).first().click()
  await chooseSegment(page, 'What was hardest?', 'Nothing in particular')
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  const panel = page.locator('.completion-panel')
  await expect(panel.locator('.new-part-notice')).toContainText('New part lit: target split.')
  await panel.getByRole('button', { name: 'Try it in the Request console' }).click()
  await expect(page).toHaveURL(/#\/request-console$/)
  await expect(part(page, 'Target split')).toContainText('Lit')
  // Back on the finished rep, the note is not repeated.
  await page.goBack()
  await expect(page.locator('.completion-panel')).toBeVisible()
  await expect(page.locator('.new-part-notice')).toHaveCount(0)
})
