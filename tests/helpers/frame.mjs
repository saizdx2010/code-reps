import { JSDOM } from 'jsdom'
import { buildFrontendFrame } from '../../src/frontend-frame.ts'

/**
 * Runs a frontend rep's sandboxed frame in JSDOM and captures the report it posts.
 * `inspect` sees the live window before it closes, for preview and interaction assertions.
 */
export function runFrame(code, rep, { mode = 'checks', scenario, runtime, token = 'test-token' } = {}, inspect) {
  let report
  const dom = new JSDOM(buildFrontendFrame(code, rep, token, mode, scenario, runtime), {
    runScripts: 'dangerously',
    beforeParse(window) {
      window.postMessage = data => {
        report = data
      }
    },
  })
  try {
    return { report, value: inspect?.(dom.window) }
  } finally {
    dom.window.close()
  }
}

/** The frame's compile or runtime error, otherwise the names of its failed checks. */
export function frameFailures(code, rep, options) {
  const { report } = runFrame(code, rep, options)
  return report.error
    ? [report.error]
    : Array.from(report.results)
        .filter(result => !result.passed)
        .map(result => result.name)
}
