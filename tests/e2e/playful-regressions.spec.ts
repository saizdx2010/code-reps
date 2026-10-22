import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'

// Regressions from the playful-practice bug scan: each test reproduces a failure the scan confirmed.

const day = 86_400_000
const record = (repId: string, daysAgo: number, code = 'code') => ({
  id: `${repId}-${daysAgo}`,
  repId,
  completedAt: new Date(Date.now() - daysAgo * day).toISOString(),
  plan: 'plan',
  code,
  explanation: 'explanation',
  hintCount: 0,
})
const steps = (page: Page) => page.getByRole('navigation', { name: 'Practice steps' })

test('Game of Life: Clear during a slow step keeps the cleared board', async ({ page }) => {
  const slow =
    "function nextGeneration(g:string[]) { const t=Date.now(); while(Date.now()-t<1500){} return g.map((row,r)=>Array.from(row,(ch,c)=>{ let n=0; for(let y=r-1;y<=r+1;y++) for(let x=c-1;x<=c+1;x++) if((y!==r||x!==c)&&g[y]?.charAt(x)==='#') n++; return (n===3||(ch==='#'&&n===2))?'#':'.' }).join('')) }"
  await page.goto('/#/home')
  await page.evaluate(
    value => localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(value)),
    [
      record('life-count-neighbours', 0.01, 'function countNeighbours(g:string[], p:[number,number]) { return 0 }'),
      record('life-next-cell', 0.02, 'function nextCell(alive:boolean, n:number) { return n===3 || (alive && n===2) }'),
      record('life-next-generation', 0.03, slow),
    ],
  )
  await page.goto('/#/projects')
  await page.reload()
  const toy = page.getByRole('article', { name: 'Game of Life' })
  const board = toy.getByRole('grid')
  await toy.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(toy).toContainText('running your code')
  await toy.getByRole('button', { name: 'Clear' }).click()
  await expect(board).toHaveAccessibleName(/generation 0, 0 live cells/)
  await expect(toy).not.toContainText('running your code', { timeout: 20_000 })
  await expect(board).toHaveAccessibleName(/generation 0, 0 live cells/)
})

test('Break it: a reset while saved tries are checked clears the checking notice', async ({ page, context }) => {
  await context.route(/runner\.worker/, async route => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    await route.continue()
  })
  await page.goto('/#/home')
  await page.evaluate(() => {
    const code = '[\n  {"input":[7,3],"suspect":"3","contract":"3","caught":[]}\n]'
    localStorage.setItem(
      'code-reps:profile:default:attempt:break-page-count:v1',
      JSON.stringify({ plan: '', code, explanation: '', hintCount: 0 }),
    )
  })
  await page.goto('/#/practice/break-page-count')
  await page.reload()
  await expect(page.getByText('Checking your saved tries')).toBeVisible()
  await page.locator('.workspace-options > summary').click()
  await page.locator('.workspace-options').getByRole('button', { name: 'Reset rep' }).click()
  await page.locator('.reset-dialog-confirm').click()
  await expect(page.getByText('No tries yet.')).toBeVisible()
  await expect(page.getByText('Checking your saved tries')).toBeHidden({ timeout: 15_000 })
})

test('Break it: a keyboard try returns focus to Try it', async ({ page }) => {
  await page.goto('/#/practice/break-page-count')
  const hunt = page.getByRole('region', { name: 'Your move' })
  await hunt.getByLabel('items', { exact: true }).fill('7')
  await hunt.getByLabel('perPage', { exact: true }).fill('3')
  await hunt.getByRole('button', { name: 'Try it' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('list', { name: 'Your tries, newest first' }).getByRole('listitem')).toHaveCount(1)
  await expect(hunt.getByRole('button', { name: 'Try it' })).toBeFocused()
})

test('Today set: starting a warm-up ends an abandoned set', async ({ page }) => {
  await page.goto('/#/home')
  await page.evaluate(
    value => {
      localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(value))
      sessionStorage.setItem('code-reps:ui:default:today-set', 'r:make-arrays,n:count-above-threshold')
    },
    [record('make-arrays', 9), record('sum-positive-numbers', 6), record('count-words', 4)],
  )
  await page.reload()
  await page.getByRole('region', { name: 'Quick warm-up' }).getByRole('button', { name: 'Start warm-up' }).click()
  await expect(page.locator('.workspace-header')).toContainText('Warm-up · 1 of 3')
  await expect(page.locator('.workspace-header')).not.toContainText('Set ·')
  expect(await page.evaluate(() => sessionStorage.getItem('code-reps:ui:default:today-set'))).toBe('')
})

test('Today set: the cool-down still shows the trace after a reload', async ({ page }) => {
  await page.goto('/#/home')
  await page.evaluate(() => sessionStorage.setItem('code-reps:ui:default:today-set', 'n:algo-climb-stairs'))
  await page.goto('/#/practice/algo-climb-stairs')
  await page.reload()
  await steps(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await page.getByLabel('Your plan', { exact: true }).fill('Work through the input once and return the answer.')
  await steps(page).getByRole('button', { name: 'Solve', exact: true }).click()
  await replaceCode(
    page,
    'function climbStairs(n: number): number { const ways = [1, 1]; for (let i = 2; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2]; return ways[n] }',
    'algo-climb-stairs',
  )
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await steps(page).getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByLabel('Your explanation', { exact: true }).fill('It returns the answer the contract asks for, in one pass.')
  await steps(page).getByRole('button', { name: 'Finish', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rep', exact: true }).click()
  await page.reload()
  await steps(page).getByRole('button', { name: 'Finish', exact: true }).click()
  await page.locator('.completion-panel').getByRole('button', { name: 'Cool-down: call the steps of the trace' }).click()
  const run = page.locator('.see-it-run')
  await expect(run.getByRole('heading', { name: 'Cool-down: see it run' })).toBeVisible()
  await expect(run.getByRole('button', { name: 'Stop predicting', exact: true })).toBeVisible()
})
