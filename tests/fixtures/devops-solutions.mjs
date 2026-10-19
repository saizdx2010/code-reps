// Independent implementations of the DevOps track's authored policies; no production helper is reused.
export const devopsSolutions = {
  'devops-exit-meaning': `
function exitMeaning(code: number): string {
  if (code === 0) return 'passed'
  if (code === 126) return 'not executable'
  if (code === 127) return 'command not found'
  if (code > 128) return 'stopped by signal ' + (code - 128)
  return 'failed with code ' + code
}`,
  'devops-first-error': `
function firstError(lines: string[]) {
  for (let index = 0; index < lines.length; index++) {
    const text = lines[index]
      .replace(/\\u001b\\[[0-9;]*m/g, '')
      .replace(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z /, '')
      .trim()
    const lower = text.toLowerCase()
    if (lower.startsWith('warn') || lower.includes('process completed with exit code')) continue
    if (/^(error|fatal)\\b/.test(lower) || lower.startsWith('npm err!') || lower.includes(': error ')) return { line: index + 1, text }
  }
  return null
}`,
  'devops-step-outcomes': `
type Step = { name: string; exitCode: number; when: 'success' | 'failure' | 'always'; continueOnError: boolean }
function stepOutcomes(steps: Step[]) {
  let failed = false
  const outcomes = steps.map(step => {
    const runs = step.when === 'always' || (step.when === 'success' && !failed) || (step.when === 'failure' && failed)
    if (!runs) return { name: step.name, outcome: 'skipped' }
    if (step.exitCode === 0) return { name: step.name, outcome: 'passed' }
    if (step.continueOnError) return { name: step.name, outcome: 'ignored' }
    failed = true
    return { name: step.name, outcome: 'failed' }
  })
  return { status: failed ? 'failure' : 'success', outcomes }
}`,
  'devops-error-annotations': `
function annotations(lines: string[], limit: number) {
  const found: { file: string; line: number; column: number; code: string; message: string }[] = []
  const seen = new Set<string>()
  let omitted = 0
  for (const raw of lines) {
    const match = /^([^\\s()]+)\\((\\d+),(\\d+)\\): error (TS\\d+): (.+)$/.exec(raw.trim())
    if (!match) continue
    const [, file, line, column, code, message] = match
    const key = [file, line, column, code].join('|')
    if (seen.has(key)) continue
    seen.add(key)
    if (found.length < limit) found.push({ file, line: Number(line), column: Number(column), code, message })
    else omitted++
  }
  return { annotations: found, omitted }
}`,
  'devops-failing-step': `
function failingStep(steps: { name: string; exitCode: number; continueOnError: boolean; log: string[] }[]) {
  const step = steps.find(item => item.exitCode !== 0 && !item.continueOnError)
  if (!step) return null
  const index = step.log.findIndex(line => /^(error|fatal)\\b/i.test(line.trim()))
  if (index !== -1) return { step: step.name, line: index + 1, cause: step.log[index].trim() }
  const code = step.exitCode
  const cause = code === 127 ? 'command not found' : code > 128 ? 'stopped by signal ' + (code - 128) : 'exit code ' + code
  return { step: step.name, line: null, cause }
}`,
}
