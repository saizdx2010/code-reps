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
  'devops-read-port': `
function readPort(env: Record<string, string>) {
  const raw = Object.hasOwn(env, 'PORT') ? env.PORT.trim() : ''
  if (raw === '') return { ok: true, port: 3000 }
  const port = /^[0-9]+$/.test(raw) ? Number(raw) : NaN
  if (port >= 1 && port <= 65535) return { ok: true, port }
  return { ok: false, error: 'PORT must be a whole number from 1 to 65535' }
}`,
  'devops-validate-env': `
type Setting = { name: string; type: 'string' | 'integer' | 'boolean'; required: boolean; default?: string }
function validateEnv(env: Record<string, string>, schema: Setting[]) {
  const errors: string[] = []
  const config: Record<string, string | number | boolean> = {}
  for (const setting of schema) {
    const given = Object.hasOwn(env, setting.name) ? env[setting.name].trim() : ''
    const raw = given !== '' ? given : setting.default?.trim()
    if (raw === undefined || raw === '') {
      if (setting.required) errors.push(setting.name + ' is required')
      continue
    }
    if (setting.type === 'string') config[setting.name] = raw
    else if (setting.type === 'integer') {
      if (/^-?[0-9]+$/.test(raw)) config[setting.name] = Number(raw)
      else errors.push(setting.name + ' must be an integer')
    } else {
      const lower = raw.toLowerCase()
      if (lower === 'true' || lower === '1') config[setting.name] = true
      else if (lower === 'false' || lower === '0') config[setting.name] = false
      else errors.push(setting.name + ' must be true or false')
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true, config }
}`,
  'devops-mask-secrets': `
function maskLog(lines: string[], env: Record<string, string>, sensitive: string[]) {
  const values = sensitive
    .filter(name => Object.hasOwn(env, name) && env[name].length >= 4)
    .map(name => env[name])
    .sort((a, b) => b.length - a.length)
  return lines.map(line => values.reduce((text, value) => text.replaceAll(value, '***'), line))
}`,
  'devops-parse-dotenv': `
function parseDotenv(text: string) {
  const values: Record<string, string> = {}
  const errors: number[] = []
  text.split('\\n').forEach((raw, index) => {
    let line = raw.trim()
    if (line === '' || line.startsWith('#')) return
    if (line.startsWith('export ')) line = line.slice('export '.length)
    const at = line.indexOf('=')
    const name = at === -1 ? '' : line.slice(0, at).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      errors.push(index + 1)
      return
    }
    let value = line.slice(at + 1).trim()
    const quote = value[0]
    if (value.length >= 2 && (quote === '"' || quote === "'") && value.endsWith(quote)) value = value.slice(1, -1)
    else {
      const comment = value.indexOf(' #')
      if (comment !== -1) value = value.slice(0, comment).trim()
    }
    values[name] = value
  })
  return { values, errors }
}`,
  'devops-config-drift': `
function configDrift(staging: Record<string, string>, production: Record<string, string>, sensitive: string[]) {
  const names = [...new Set([...Object.keys(staging), ...Object.keys(production)])].sort()
  const report: { name: string; change: string; staging?: string; production?: string }[] = []
  for (const name of names) {
    const inStaging = Object.hasOwn(staging, name)
    const inProduction = Object.hasOwn(production, name)
    if (!inProduction) report.push({ name, change: 'missing in production' })
    else if (!inStaging) report.push({ name, change: 'missing in staging' })
    else if (staging[name] !== production[name]) {
      const hide = sensitive.includes(name)
      report.push({
        name,
        change: 'different',
        staging: hide ? '***' : staging[name],
        production: hide ? '***' : production[name],
      })
    }
  }
  return report
}`,
  'devops-compare-versions': `
function compareVersions(a: string, b: string): number {
  const parts = (version: string) => version.replace(/^v/, '').split('.').map(Number)
  const left = parts(a)
  const right = parts(b)
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1
  }
  return 0
}`,
  'devops-next-version': `
function nextVersion(current: string, changes: string[]) {
  const [major, minor, patch] = current.split('.').map(Number)
  if (changes.includes('breaking')) {
    const version = major === 0 ? [0, minor + 1, 0] : [major + 1, 0, 0]
    return { version: version.join('.'), release: true }
  }
  if (changes.includes('feature')) return { version: [major, minor + 1, 0].join('.'), release: true }
  if (changes.includes('fix')) return { version: [major, minor, patch + 1].join('.'), release: true }
  return { version: current, release: false }
}`,
  'devops-sort-versions': `
function sortVersions(versions: string[]): string[] {
  const parse = (version: string) => {
    const withoutBuild = version.split('+')[0]
    const dash = withoutBuild.indexOf('-')
    const main = (dash === -1 ? withoutBuild : withoutBuild.slice(0, dash)).split('.').map(Number)
    const pre = dash === -1 ? [] : withoutBuild.slice(dash + 1).split('.')
    return { main, pre }
  }
  const numeric = (id: string) => /^[0-9]+$/.test(id)
  const compareIds = (a: string, b: string) => {
    if (numeric(a) && numeric(b)) return Number(a) - Number(b)
    if (numeric(a)) return -1
    if (numeric(b)) return 1
    return a < b ? -1 : a > b ? 1 : 0
  }
  const compare = (x: string, y: string) => {
    const a = parse(x)
    const b = parse(y)
    for (let index = 0; index < 3; index++) if (a.main[index] !== b.main[index]) return a.main[index] - b.main[index]
    if (!a.pre.length || !b.pre.length) return b.pre.length - a.pre.length
    for (let index = 0; index < Math.min(a.pre.length, b.pre.length); index++) {
      const order = compareIds(a.pre[index], b.pre[index])
      if (order !== 0) return order
    }
    return a.pre.length - b.pre.length
  }
  return [...versions].sort(compare)
}`,
  'devops-lockfile-diff': `
function lockfileDiff(before: Record<string, string>, after: Record<string, string>) {
  const parts = (version: string) => version.split('.').map(Number)
  const added: string[] = []
  const removed: string[] = []
  const upgraded: { name: string; from: string; to: string; kind: string }[] = []
  const downgraded: { name: string; from: string; to: string }[] = []
  const names = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
  for (const name of names) {
    const from = Object.hasOwn(before, name) ? before[name] : undefined
    const to = Object.hasOwn(after, name) ? after[name] : undefined
    if (from === undefined) added.push(name + '@' + to)
    else if (to === undefined) removed.push(name + '@' + from)
    else {
      const a = parts(from)
      const b = parts(to)
      const index = [0, 1, 2].find(i => a[i] !== b[i])
      if (index === undefined) continue
      if (b[index] > a[index]) upgraded.push({ name, from, to, kind: ['major', 'minor', 'patch'][index] })
      else downgraded.push({ name, from, to })
    }
  }
  return { added, removed, upgraded, downgraded }
}`,
  'devops-satisfies-range': `
function satisfies(version: string, range: string): boolean {
  const parse = (text: string) => text.split('.').map(Number)
  const compare = (a: number[], b: number[]) => {
    for (let index = 0; index < 3; index++) if (a[index] !== b[index]) return a[index] < b[index] ? -1 : 1
    return 0
  }
  const v = parse(version)
  const operator = range.startsWith('>=') ? '>=' : range.startsWith('^') ? '^' : range.startsWith('~') ? '~' : ''
  const base = parse(range.slice(operator.length))
  if (operator === '') return compare(v, base) === 0
  if (compare(v, base) < 0) return false
  if (operator === '>=') return true
  const [major, minor, patch] = base
  const limit =
    operator === '~' ? [major, minor + 1, 0] : major > 0 ? [major + 1, 0, 0] : minor > 0 ? [0, minor + 1, 0] : [0, 0, patch + 1]
  return compare(v, limit) < 0
}`,
}
