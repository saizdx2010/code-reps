import { expect, test } from '@playwright/test'
import { expectChecksFinished, replaceCode } from './helpers'

const solutions = {
  'await-local-records': `async function loadRecords(ids, fixture) {
    try { const out=[]; for(const id of ids) out.push(await fixture.fetch(id)); return out }
    catch { return null } finally { fixture.release() }
  }`,
  'settle-local-panels': `async function loadPanels(ids, fixture) {
    try { return (await Promise.allSettled(ids.map(id => fixture.fetch(id)))).map(x => x.status === 'fulfilled' ? {status:'ready',value:x.value} : {status:'error',message:x.reason.message}) }
    finally { fixture.release() }
  }`,
  'cancel-local-export': `async function exportRecords(ids, fixture) {
    try { if(fixture.signal.aborted) return {status:'cancelled'}; const out=[]; for(const id of ids) out.push(await fixture.fetch(id, fixture.signal)); return {status:'done',text:out.join('|')} }
    catch(e) { return e.name === 'AbortError' ? {status:'cancelled'} : {status:'error',message:e.message} }
    finally { fixture.release() }
  }`,
}
for (const [id, code] of Object.entries(solutions)) {
  test(`real worker awaits local fixture lifecycle: ${id}`, async ({ page }) => {
    await page.goto(`/#/practice/${id}`)
    await replaceCode(page, code, id)
    await page.keyboard.press('ControlOrMeta+Enter')
    await expectChecksFinished(page.getByText('All checks passed', {exact: true}))
  })
}
test('pending async work times out, preserves draft, and can be replaced', async ({ page }) => {
  const id = 'await-local-records'
  const stuck = 'async function loadRecords() { return await new Promise(() => {}) }'
  await page.goto(`/#/practice/${id}`)
  await replaceCode(page, stuck, id)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expect(page.getByText(/The checks took too long and were stopped/)).toBeVisible({timeout: 15_000})
  await expect.poll(() => page.evaluate(id => Object.entries(localStorage).filter(([key]) => key.includes(id)).map(([, value]) => JSON.parse(value).code), id)).toContain(stuck)
  await replaceCode(page, solutions[id], id)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', {exact: true}))
  await replaceCode(page, stuck, id)
  await page.keyboard.press('ControlOrMeta+Enter')
  await replaceCode(page, solutions[id], id)
  await expect(page.getByText('All checks passed', {exact: true})).toHaveCount(0)
  await page.keyboard.press('ControlOrMeta+Enter')
  await expectChecksFinished(page.getByText('All checks passed', {exact: true}))
})
