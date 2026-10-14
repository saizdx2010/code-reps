import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'

test('a type error is reported beside passing checks without blocking them', async ({ page }) => {
  await page.goto('/#/practice/algo-sorted-pair')
  await replaceCode(
    page,
    'function hasSortedPair(numbers: number[], target: number): boolean { let left = 0, right = numbers.length - 1; while (left < right) { const sum: string = numbers[left] + numbers[right]; if (Number(sum) === target) return true; if (Number(sum) < target) left++; else right-- } return false }',
    'algo-sorted-pair',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  const note = page.locator('.type-check')
  await expect(note).toContainText('Type check: 1 type error in the editor.')
  await expect(note).toContainText("Type 'number' is not assignable to type 'string'.")
  await expect(note).toContainText('Separate from the checks above.')
  await replaceCode(
    page,
    'function hasSortedPair(numbers: number[], target: number): boolean { let left = 0, right = numbers.length - 1; while (left < right) { const sum = numbers[left] + numbers[right]; if (sum === target) return true; if (sum < target) left++; else right-- } return false }',
    'algo-sorted-pair',
  )
  await page.getByRole('button', { name: 'Run checks', exact: true }).click()
  await expectChecksFinished(page.getByText('All checks passed', { exact: true }))
  await expect(note).toContainText('Type check: no type errors in the editor.')
})
