import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'

test('post-solve trace supports scoped keyboard navigation and narrow review', async ({ page }) => {
  await page.goto('/#/practice/algo-sorted-pair')
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Step trace' })).toHaveCount(0)
  await replaceCode(
    page,
    'function hasSortedPair(numbers: number[], target: number): boolean { let left = 0, right = numbers.length - 1; while (left < right) { const sum = numbers[left] + numbers[right]; if (sum === target) return true; if (sum < target) left++; else right-- } return false }',
    'algo-sorted-pair',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare your plan and explanation', { exact: true }).click()
  const compare = page.locator('.code-compare')
  await expect(compare.getByRole('heading', { name: 'Compare your code with the reference' })).toBeVisible()
  await expect(compare).toContainText(/Your code shares \d+ of the reference’s \d+ lines/)
  await expect(compare.getByRole('list', { name: 'Line comparison' }).getByRole('listitem').first()).toBeVisible()
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await viewer.focus()
  await expect(viewer.getByRole('button', { name: 'Prev', exact: true })).toBeDisabled()
  await viewer.press('ArrowRight')
  await expect(viewer.locator('.trace-note')).toContainText('Step 2 of 7')
  await expect(viewer.locator('.trace-vars')).toContainText('changed')
  await viewer.press('ArrowLeft')
  await expect(viewer.locator('.trace-note')).toContainText('Step 1 of 7')
  await page.getByRole('button', { name: 'Explain', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(viewer.locator('.trace-note')).toContainText('Step 1 of 7')
  await viewer.getByRole('button', { name: 'Go to step 7', exact: true }).click()
  await expect(viewer.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
  await viewer.press('ArrowRight')
  await expect(viewer.locator('.trace-note')).toContainText('Step 7 of 7')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 844 })
  await expect(viewer).toBeVisible()
  expect(await viewer.locator('.trace-panes').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length)).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('tree trace renders the current node and steps by keyboard at a narrow width', async ({ page }) => {
  await page.goto('/#/practice/algo-tree-depth')
  await replaceCode(
    page,
    'function treeDepth(root: TreeNode | null): number { if (root === null) return 0; let deepest = 0; for (const child of root.children) deepest = Math.max(deepest, treeDepth(child)); return 1 + deepest }',
    'algo-tree-depth',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare your plan and explanation', { exact: true }).click()
  await page.setViewportSize({ width: 320, height: 844 })
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await viewer.focus()
  await expect(viewer.locator('.trace-tree circle')).toHaveCount(4)
  await expect(viewer.locator('.trace-tree .trace-node-current')).toHaveCount(1)
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('Current node: 0')
  await viewer.press('ArrowRight')
  await expect(viewer.locator('.trace-note')).toContainText('Step 2 of 8')
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('Current node: 7')
  await viewer.press('ArrowRight')
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('Visited nodes: 7')
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('7 (depth 1)')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('recursion trace shows a call stack that grows and shrinks', async ({ page }) => {
  await page.goto('/#/practice/algo-recursive-sum')
  await replaceCode(
    page,
    'type NestedNumber = number | NestedNumber[]; function recursiveSum(items: NestedNumber[]): number { let total = 0; for (const item of items) { if (Array.isArray(item)) total += recursiveSum(item); else total += item } return total }',
    'algo-recursive-sum',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare your plan and explanation', { exact: true }).click()
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await viewer.focus()
  await expect(viewer.locator('.trace-frame')).toHaveCount(1)
  await viewer.getByRole('button', { name: 'Go to step 4', exact: true }).click()
  await expect(viewer.locator('.trace-frame')).toHaveCount(3)
  await expect(viewer.locator('.trace-frame-top')).toContainText('recursiveSum([])')
  await viewer.getByRole('button', { name: 'Go to step 5', exact: true }).click()
  await expect(viewer.locator('.trace-frame-top')).toContainText('returns 0')
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('will be popped')
})

test('table trace shows filled, current, and read cells and steps by keyboard at 320px', async ({ page }) => {
  await page.goto('/#/practice/algo-climb-stairs')
  await replaceCode(
    page,
    'function climbStairs(n: number): number { const ways = [1, 1]; for (let i = 2; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2]; return ways[n] }',
    'algo-climb-stairs',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expect(page.getByText('All checks passed', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare your plan and explanation', { exact: true }).click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 844 })
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await viewer.focus()
  await expect(viewer.locator('.trace-cell')).toHaveCount(5)
  await expect(viewer.locator('.trace-cell-empty')).toHaveCount(5)
  await viewer.press('ArrowRight')
  await expect(viewer.locator('.trace-cell-filled')).toHaveCount(2)
  await expect(viewer.locator('.trace-cell-empty')).toHaveCount(3)
  await viewer.press('ArrowRight')
  await expect(viewer.locator('.trace-cell-now')).toHaveCount(1)
  await expect(viewer.locator('.trace-cell-now .trace-cell-tag')).toHaveText('now')
  await expect(viewer.locator('.trace-cell-read .trace-cell-tag')).toHaveText(['↑ reads', '↑ reads'])
  await expect(viewer.locator('.trace-table-focus')).toContainText('Filling ways[2], which reads ways[1] and ways[0]')
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('2 = 2')
  await expect(viewer.locator('.trace-note')).toContainText('Step 3 of 6')
  await viewer.press('ArrowLeft')
  await expect(viewer.locator('.trace-note')).toContainText('Step 2 of 6')
  const box = await viewer.locator('.trace-table').boundingBox()
  expect(box!.x + box!.width).toBeLessThanOrEqual(320)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('graph trace draws nodes and edges, and predict mode hides each step until revealed', async ({ page }) => {
  await page.goto('/#/practice/algo-graph-reachable')
  await replaceCode(
    page,
    'function graphReachable(graph: number[][], start: number, target: number): boolean { if (start < 0 || target < 0 || start >= graph.length || target >= graph.length) return false; const queue = [start], seen = new Set([start]); for (let head = 0; head < queue.length; head++) { const node = queue[head]; if (node === target) return true; for (const next of graph[node]) if (!seen.has(next)) { seen.add(next); queue.push(next) } } return false }',
    'algo-graph-reachable',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await page.getByRole('button', { name: 'Explain', exact: true }).click()
  await page.getByText('Compare your plan and explanation', { exact: true }).click()
  const viewer = page.getByRole('region', { name: 'Step trace' })
  await expect(viewer.locator('.trace-graph .trace-edge')).toHaveCount(2)
  await expect(viewer.locator('.trace-structure .sr-only')).toContainText('Directed graph with nodes 0, 1, 2')
  await viewer.getByRole('button', { name: 'Predict each step', exact: true }).click()
  await viewer.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(viewer.locator('.trace-graph')).toHaveCount(0)
  await expect(viewer.locator('.trace-note')).toContainText('Predict seen, queue')
  await viewer.getByRole('textbox', { name: 'Predict queue' }).fill('[ 0 ]')
  await viewer.getByRole('button', { name: 'Reveal step', exact: true }).click()
  await expect(viewer.locator('.trace-graph')).toHaveCount(1)
  await expect(viewer.getByText('Your prediction matched.')).toBeVisible()
  await expect(viewer.getByRole('status')).toContainText('matched 1 of 2')
  await viewer.getByRole('button', { name: 'Stop predicting', exact: true }).click()
  await expect(viewer.locator('.trace-note')).toContainText('Step 1 of 7')
})
