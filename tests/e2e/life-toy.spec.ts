import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Reference solutions from tests/fixtures/dsa-solutions.mjs, saved as if the learner had completed each part.
const parts = {
  'life-count-neighbours':
    "function countNeighbours(g:string[], p:[number,number]) { const [r,c]=p; if(r<0||c<0||r>=g.length||c>=(g[0]?.length??0)) return 0; let n=0; for(const y of [r-1,r,r+1]) for(const x of [c-1,c,c+1]) if((y!==r||x!==c)&&y>=0&&y<g.length&&x>=0&&x<g[y].length&&g[y][x]==='#') n++; return n }",
  'life-next-cell': 'function nextCell(alive:boolean, n:number) { return n===3 || (alive && n===2) }',
  'life-next-generation':
    "function nextGeneration(g:string[]) { const counts=g.map((row,r)=>Array.from(row,(_,c)=>{ let n=0; for(let y=r-1;y<=r+1;y++) for(let x=c-1;x<=c+1;x++) if((y!==r||x!==c)&&g[y]?.charAt(x)==='#') n++; return n })); return g.map((row,r)=>Array.from(row,(ch,c)=>(counts[r][c]===3||(ch==='#'&&counts[r][c]===2))?'#':'.').join('')) }",
}
const wrapping =
  "function nextGeneration(g:string[]) { const h=g.length, w=g[0]?.length??0; return g.map((row,r)=>Array.from(row,(ch,c)=>{ let n=0; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if((dy||dx)&&g[(r+dy+h)%h][(c+dx+w)%w]==='#') n++; return (n===3||(ch==='#'&&n===2))?'#':'.' }).join('')) }"

/** Only this test's fresh browser context receives the sample history. */
async function seed(page: Page, code: Partial<Record<keyof typeof parts, string>>) {
  await page.goto('/#/home')
  await page.evaluate(value => {
    const history = Object.entries(value).map(([repId, source], index) => ({
      id: `${repId}-${index}`,
      repId,
      completedAt: new Date(Date.now() - (index + 1) * 60_000).toISOString(),
      plan: 'plan',
      code: source,
      explanation: 'explanation',
      hintCount: 0,
    }))
    localStorage.setItem('code-reps:profile:default:history:v1', JSON.stringify(history))
  }, code)
  await page.goto('/#/projects')
  await page.reload()
  return page.getByRole('article', { name: 'Game of Life' })
}

test('until every part is built, the toy lists its parts and opens the next one', async ({ page }) => {
  const toy = await seed(page, { 'life-count-neighbours': parts['life-count-neighbours'] })
  await expect(toy).toContainText('1 of 3 parts built')
  await expect(toy.getByRole('grid')).toHaveCount(0)
  await toy.getByRole('button', { name: /Build nextCell/ }).click()
  await expect(page).toHaveURL(/#\/practice\/life-next-cell$/)
})

test('with every part built, the board steps on the learner’s code and answers about one cell', async ({ page }) => {
  const toy = await seed(page, parts)
  const board = toy.getByRole('grid')
  await expect(board).toHaveAccessibleName(/generation 0, 8 live cells/)
  await toy.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(board).toHaveAccessibleName(/generation 1, 8 live cells/)
  // A cell is a button: click it to switch it; with focus on it, I asks the learner's code about it.
  const cell = board.getByRole('gridcell', { name: 'Row 1, column 1, dead' })
  await cell.click()
  await expect(board.getByRole('gridcell', { name: 'Row 1, column 1, live' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(board.getByRole('gridcell', { name: /^Row 1, column 2,/ })).toBeFocused()
  await page.keyboard.press('i')
  await expect(toy.getByRole('status')).toContainText(
    /Row 1, column 2: your countNeighbours says \d+, and your nextCell says it will be (live|dead)\./,
  )
  await toy.getByRole('button', { name: 'Play' }).click()
  await expect(board).toHaveAccessibleName(/generation [3-9]/)
  await toy.getByRole('button', { name: 'Pause' }).click()
  await expect(toy.getByRole('alert')).toHaveCount(0)
})

test('a generation that breaks the rules pauses play and marks the cells', async ({ page }) => {
  const toy = await seed(page, { ...parts, 'life-next-generation': wrapping })
  await toy.getByRole('button', { name: 'Clear' }).click()
  const board = toy.getByRole('grid')
  for (const row of [1, 2, 3]) await board.getByRole('gridcell', { name: `Row ${row}, column 1, dead` }).click()
  await toy.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(toy.getByRole('alert')).toContainText('Generation 1 differs from the rules in')
  await expect(board.getByRole('gridcell', { name: /differs from the rules/ }).first()).toBeVisible()
  await expect(toy.getByRole('button', { name: /Open nextGeneration/ })).toBeVisible()
})

test('code that never finishes is stopped after five seconds and the page stays usable', async ({ page }) => {
  const toy = await seed(page, { ...parts, 'life-next-generation': 'function nextGeneration(g:string[]) { while (true) {} return g }' })
  await toy.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(toy.getByRole('alert')).toContainText('more than 5 seconds', { timeout: 15_000 })
  await expect(toy.getByRole('button', { name: 'Step', exact: true })).toBeEnabled()
})
