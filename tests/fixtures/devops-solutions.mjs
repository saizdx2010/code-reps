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
  'devops-job-waves': `
function jobWaves(jobs: { name: string; needs: string[] }[]) {
  const names = new Set(jobs.map(job => job.name))
  for (const job of jobs) {
    const need = job.needs.find(item => !names.has(item))
    if (need !== undefined) return { ok: false, error: 'UNKNOWN_NEED', job: job.name, need }
  }
  const placed = new Set<string>()
  const waves: string[][] = []
  let left = jobs
  while (left.length) {
    const wave = left.filter(job => job.needs.every(need => placed.has(need))).map(job => job.name)
    if (!wave.length) return { ok: false, error: 'CYCLE', jobs: left.map(job => job.name) }
    for (const name of wave) placed.add(name)
    waves.push(wave)
    left = left.filter(job => !placed.has(job.name))
  }
  return { ok: true, waves }
}`,
  'devops-cache-key': `
function cacheKey(job: string, os: string, keyFiles: string[], files: Record<string, string>): string {
  const text = [...new Set(keyFiles)]
    .sort()
    .map(path => path + '\\n' + (Object.hasOwn(files, path) ? files[path] : '<missing>') + '\\n')
    .join('')
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0
  return job + '-' + os + '-' + hash.toString(16).padStart(8, '0')
}`,
  'devops-cache-restore': `
function restoreCache(key: string, restoreKeys: string[], caches: { key: string; createdAt: number }[]) {
  if (caches.some(cache => cache.key === key)) return { hit: 'exact', key }
  for (const prefix of restoreKeys) {
    let best: { key: string; createdAt: number } | undefined
    for (const cache of caches) if (cache.key.startsWith(prefix) && (!best || cache.createdAt > best.createdAt)) best = cache
    if (best) return { hit: 'partial', key: best.key }
  }
  return { hit: 'miss', key: null }
}`,
  'devops-pipeline-duration': `
function pipelineTimes(jobs: { name: string; minutes: number; needs: string[] }[]) {
  const byName = new Map(jobs.map(job => [job.name, job]))
  const finish: Record<string, number> = {}
  const finishOf = (name: string): number => {
    if (!Object.hasOwn(finish, name)) {
      const job = byName.get(name)!
      finish[name] = Math.max(0, ...job.needs.map(finishOf)) + job.minutes
    }
    return finish[name]
  }
  for (const job of jobs) finishOf(job.name)
  const latest = (names: string[]) => names.reduce((best, name) => (finish[name] > finish[best] ? name : best), names[0])
  const criticalPath: string[] = []
  let current = jobs.length ? latest(jobs.map(job => job.name)) : undefined
  while (current !== undefined) {
    criticalPath.push(current)
    const needs = byName.get(current)!.needs
    current = needs.length ? latest(needs) : undefined
  }
  return { finish, total: Math.max(0, ...Object.values(finish)), criticalPath: criticalPath.reverse() }
}`,
  'devops-skip-unchanged': `
function jobsToRun(jobs: { name: string; needs: string[]; paths: string[] }[], changed: string[]) {
  const byName = new Map(jobs.map(job => [job.name, job]))
  const matches = (path: string, file: string) => (path.endsWith('/') ? file.startsWith(path) : file === path)
  const decided = new Map<string, boolean>()
  const runs = (name: string): boolean => {
    if (!decided.has(name)) {
      const job = byName.get(name)!
      decided.set(name, job.paths.some(path => changed.some(file => matches(path, file))) || job.needs.some(runs))
    }
    return decided.get(name)!
  }
  return {
    run: jobs.filter(job => runs(job.name)).map(job => job.name),
    skip: jobs.filter(job => !runs(job.name)).map(job => job.name),
  }
}`,
  'devops-layer-rebuild': `
function layerRebuilds(steps: { instruction: string; copies: string[] }[], changed: string[]): string[] {
  const matches = (source: string, file: string) => source === '.' || (source.endsWith('/') ? file.startsWith(source) : file === source)
  let rebuilding = false
  return steps.map(step => {
    if (!rebuilding) rebuilding = step.copies.some(source => changed.some(file => matches(source, file)))
    return rebuilding ? 'rebuilt' : 'cached'
  })
}`,
  'devops-image-tags': `
function imageTags(ref: string, sha: string): string[] {
  const convert = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/^[.-]+/, '')
      .slice(0, 40)
  const shaTag = 'sha-' + sha.slice(0, 7)
  if (ref.startsWith('refs/heads/')) {
    const branch = ref.slice('refs/heads/'.length)
    if (branch === 'main') return ['main', 'edge', shaTag]
    const name = convert(branch)
    return name ? [name, shaTag] : [shaTag]
  }
  const tag = ref.slice('refs/tags/'.length)
  const version = /^v?(\\d+)\\.(\\d+)\\.(\\d+)(-.+)?$/.exec(tag)
  if (version) {
    const [, major, minor, patch, pre] = version
    if (pre) return [major + '.' + minor + '.' + patch + pre, shaTag]
    return [major + '.' + minor + '.' + patch, major + '.' + minor, major, 'latest', shaTag]
  }
  const name = convert(tag)
  return name ? [name, shaTag] : [shaTag]
}`,
  'devops-dockerignore': `
function buildContext(files: string[], ignore: string[]): string[] {
  const rules = ignore
    .map(line => line.trim())
    .filter(line => line !== '' && !line.startsWith('#'))
    .map(line => (line.startsWith('!') ? { pattern: line.slice(1), keep: true } : { pattern: line, keep: false }))
  const matches = (pattern: string, path: string) => {
    if (pattern.endsWith('/')) return path.startsWith(pattern)
    if (pattern.startsWith('*.')) return path.slice(path.lastIndexOf('/') + 1).endsWith(pattern.slice(1))
    return path === pattern || path.startsWith(pattern + '/')
  }
  return files.filter(path => {
    let keep = true
    for (const rule of rules) if (matches(rule.pattern, path)) keep = rule.keep
    return keep
  })
}`,
  'devops-tag-cleanup': `
function tagsToDelete(tags: { name: string; branch: string; pushedAt: number }[], keepPerBranch: number, deployed: string[]): string[] {
  const isProtected = (name: string) => deployed.includes(name) || /^\\d+\\.\\d+\\.\\d+$/.test(name)
  const byBranch = new Map<string, { name: string; pushedAt: number }[]>()
  for (const tag of tags) {
    if (isProtected(tag.name)) continue
    byBranch.set(tag.branch, [...(byBranch.get(tag.branch) ?? []), tag])
  }
  const doomed = new Set<string>()
  for (const group of byBranch.values()) {
    const newestFirst = [...group].sort((a, b) => b.pushedAt - a.pushedAt)
    for (const tag of newestFirst.slice(keepPerBranch)) doomed.add(tag.name)
  }
  return tags.filter(tag => doomed.has(tag.name)).map(tag => tag.name)
}`,
  'devops-multistage-rebuild': `
type Step = { copies: string[]; fromStage?: string }
function stageRebuilds(stages: { name: string; from: string; steps: Step[] }[], changed: string[]) {
  const matches = (source: string, file: string) => source === '.' || (source.endsWith('/') ? file.startsWith(source) : file === source)
  const changedStages = new Set<string>()
  const result: Record<string, string[]> = {}
  for (const stage of stages) {
    let rebuilding = changedStages.has(stage.from)
    result[stage.name] = stage.steps.map(step => {
      if (!rebuilding)
        rebuilding =
          step.fromStage !== undefined
            ? changedStages.has(step.fromStage)
            : step.copies.some(source => changed.some(file => matches(source, file)))
      return rebuilding ? 'rebuilt' : 'cached'
    })
    if (rebuilding) changedStages.add(stage.name)
  }
  return result
}`,
  'devops-rolling-batches': `
function rollingBatches(instances: string[], maxUnavailablePercent: number) {
  const batchSize = Math.max(1, Math.floor((instances.length * maxUnavailablePercent) / 100))
  const batches: string[][] = []
  for (let start = 0; start < instances.length; start += batchSize) batches.push(instances.slice(start, start + batchSize))
  return { batchSize, minAvailable: instances.length - batchSize, batches }
}`,
  'devops-percent-rollout': `
function inRollout(userId: string, percent: number, flag: string) {
  const text = flag + ':' + userId
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0
  const bucket = hash % 100
  return { bucket, enabled: bucket < percent }
}`,
  'devops-blue-green': `
type Color = 'blue' | 'green'
type Event = { type: 'deploy'; version: string } | { type: 'check'; passed: boolean } | { type: 'switch' } | { type: 'rollback' }
function blueGreen(events: Event[]) {
  let live: Color = 'blue'
  const versions: Record<Color, string | null> = { blue: 'v1', green: null }
  let idleHealth: 'unchecked' | 'healthy' | 'failed' = 'unchecked'
  let target: Color | null = null
  const refused: number[] = []
  const idle = (): Color => (live === 'blue' ? 'green' : 'blue')
  events.forEach((event, index) => {
    if (event.type === 'deploy') {
      versions[idle()] = event.version
      idleHealth = 'unchecked'
      target = null
    } else if (event.type === 'check') {
      if (versions[idle()] === null) refused.push(index)
      else idleHealth = event.passed ? 'healthy' : 'failed'
    } else if (event.type === 'switch') {
      if (idleHealth !== 'healthy' || versions[idle()] === null) refused.push(index)
      else {
        target = live
        live = idle()
        idleHealth = 'healthy'
      }
    } else if (target === null) refused.push(index)
    else {
      live = target
      idleHealth = 'failed'
      target = null
    }
  })
  return { live, versions: { blue: versions.blue, green: versions.green }, refused }
}`,
  'devops-canary-schedule': `
function canaryStep(steps: { percent: number; holdMinutes: number }[], minutesSinceStart: number, pauses: { from: number; to: number }[]) {
  const paused = pauses.reduce((total, pause) => total + Math.max(0, Math.min(pause.to, minutesSinceStart) - Math.max(pause.from, 0)), 0)
  const active = minutesSinceStart - paused
  let current = 0
  let start = 0
  for (let index = 0; index < steps.length; index++) {
    if (start > active) break
    current = index
    start += steps[index].holdMinutes
  }
  return { step: current, percent: steps[current].percent }
}`,
  'devops-canary-verdict': `
function canaryVerdict(
  samples: { requests: number; errors: number }[],
  policy: { maxErrorPercent: number; minRequests: number; healthyNeeded: number; unhealthyNeeded: number },
) {
  let healthy = 0
  let unhealthy = 0
  for (let index = 0; index < samples.length; index++) {
    const { requests, errors } = samples[index]
    if (requests < policy.minRequests) continue
    if (errors * 100 > policy.maxErrorPercent * requests) {
      unhealthy++
      healthy = 0
      if (unhealthy >= policy.unhealthyNeeded) return { decision: 'rollback', at: index }
    } else {
      healthy++
      unhealthy = 0
      if (healthy >= policy.healthyNeeded) return { decision: 'promote', at: index }
    }
  }
  return { decision: 'continue', at: null }
}`,
  'devops-health-endpoints': `
type State = { started: boolean; shuttingDown: boolean; stalled: boolean; dependencies: { name: string; required: boolean; up: boolean }[] }
function healthEndpoints(state: State) {
  const reasons: string[] = []
  if (!state.started) reasons.push('starting')
  if (state.shuttingDown) reasons.push('shutting down')
  for (const dependency of state.dependencies) if (dependency.required && !dependency.up) reasons.push(dependency.name + ' is down')
  return { live: { status: state.stalled ? 503 : 200 }, ready: { status: reasons.length ? 503 : 200, reasons } }
}`,
  'devops-probe-thresholds': `
function serviceTimeline(results: boolean[], healthyThreshold: number, unhealthyThreshold: number): boolean[] {
  let inService = false
  let passes = 0
  let failures = 0
  return results.map(passed => {
    if (passed) {
      passes++
      failures = 0
      if (!inService && passes >= healthyThreshold) inService = true
    } else {
      failures++
      passes = 0
      if (inService && failures >= unhealthyThreshold) inService = false
    }
    return inService
  })
}`,
  'devops-restart-backoff': `
function restartDelays(runs: number[], policy: { baseSeconds: number; maxSeconds: number; resetAfterSeconds: number }): number[] {
  let crashes = 0
  return runs.map(seconds => {
    if (seconds >= policy.resetAfterSeconds) crashes = 0
    const delay = Math.min(policy.maxSeconds, policy.baseSeconds * 2 ** crashes)
    crashes++
    return delay
  })
}`,
  'devops-liveness-restart': `
function livenessRestart(probe: { initialDelay: number; period: number; failureThreshold: number }, stalls: { from: number; to: number }[], horizon: number) {
  let failures = 0
  for (let t = probe.initialDelay; t <= horizon; t += probe.period) {
    if (stalls.some(stall => stall.from <= t && t < stall.to)) {
      failures++
      if (failures >= probe.failureThreshold) return t
    } else failures = 0
  }
  return null
}`,
  'devops-graceful-drain': `
function gracefulDrain(requests: { id: string; arrives: number; finishes: number }[], shutdownAt: number, policy: { acceptForSeconds: number; graceSeconds: number }) {
  const stopAccepting = shutdownAt + policy.acceptForSeconds
  const deadline = shutdownAt + policy.graceSeconds
  const completed: string[] = []
  const rejected: string[] = []
  const cutOff: string[] = []
  let busyUntil = stopAccepting
  for (const request of requests) {
    if (request.arrives >= stopAccepting) {
      rejected.push(request.id)
      continue
    }
    if (request.finishes <= deadline) completed.push(request.id)
    else cutOff.push(request.id)
    busyUntil = Math.max(busyUntil, request.finishes)
  }
  return { completed, rejected, cutOff, exitAt: Math.min(deadline, busyUntil) }
}`,
  'devops-cron-field': `
function expandField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>()
  for (const part of field.split(',')) {
    const match = /^(\\*|(\\d+)(?:-(\\d+))?)(?:\\/(\\d+))?$/.exec(part)
    if (!match) return null
    const [, base, first, last, stepText] = match
    if (stepText !== undefined && base !== '*' && last === undefined) return null
    const start = base === '*' ? min : Number(first)
    const end = base === '*' ? max : last !== undefined ? Number(last) : start
    const step = stepText === undefined ? 1 : Number(stepText)
    if (start < min || end > max || start > end || step < 1) return null
    for (let value = start; value <= end; value += step) values.add(value)
  }
  return [...values].sort((a, b) => a - b)
}`,
  'devops-cron-matches': `
function cronMatches(expression: string, time: { minute: number; hour: number; day: number; month: number; weekday: number }): boolean {
  const expand = (field: string, min: number, max: number) => {
    const values = new Set<number>()
    for (const part of field.split(',')) {
      const [range, stepText] = part.split('/')
      const [low, high] = range === '*' ? [min, max] : range.split('-').map(Number)
      const end = range === '*' || range.includes('-') ? high : low
      for (let value = low; value <= end; value += stepText ? Number(stepText) : 1) values.add(value)
    }
    return values
  }
  const [minute, hour, dom, month, dow] = expression.split(' ')
  const weekdays = new Set([...expand(dow, 0, 7)].map(day => day % 7))
  const domOk = expand(dom, 1, 31).has(time.day)
  const dowOk = weekdays.has(time.weekday)
  const dayOk = !dom.startsWith('*') && !dow.startsWith('*') ? domOk || dowOk : domOk && dowOk
  return expand(minute, 0, 59).has(time.minute) && expand(hour, 0, 23).has(time.hour) && expand(month, 1, 12).has(time.month) && dayOk
}`,
  'devops-local-to-utc': `
function localToUtc(local: string, zone: string) {
  const format = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
  const wall = (ms: number) => {
    const parts: Record<string, number> = {}
    for (const part of format.formatToParts(new Date(ms))) if (part.type !== 'literal') parts[part.type] = Number(part.value)
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
  }
  const [date, clock] = local.split('T')
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = clock.split(':').map(Number)
  const target = Date.UTC(year, month - 1, day, hour, minute)
  const offsets = new Set([-86400000, 0, 86400000].map(shift => wall(target + shift) - (target + shift)))
  const found = [...offsets]
    .map(offset => target - offset)
    .filter(instant => wall(instant) === target)
    .sort((a, b) => a - b)
    .map(instant => new Date(instant).toISOString())
  if (found.length === 0) return { status: 'gap' }
  if (found.length === 1) return { status: 'ok', instant: found[0] }
  return { status: 'overlap', instants: found }
}`,
  'devops-cron-next-utc': `
function nextRunUtc(expression: string, after: string): string | null {
  const expand = (field: string, min: number, max: number) => {
    const values = new Set<number>()
    for (const part of field.split(',')) {
      const [range, stepText] = part.split('/')
      const [low, high] = range === '*' ? [min, max] : range.split('-').map(Number)
      const end = range === '*' || range.includes('-') ? high : low
      for (let value = low; value <= end; value += stepText ? Number(stepText) : 1) values.add(value)
    }
    return values
  }
  const [minuteField, hourField, domField, monthField, dowField] = expression.split(' ')
  const minutes = expand(minuteField, 0, 59)
  const hours = expand(hourField, 0, 23)
  const doms = expand(domField, 1, 31)
  const months = expand(monthField, 1, 12)
  const dows = new Set([...expand(dowField, 0, 7)].map(day => day % 7))
  const either = !domField.startsWith('*') && !dowField.startsWith('*')
  const start = Math.floor(Date.parse(after) / 60000) * 60000 + 60000
  const limit = Date.parse(after) + 366 * 86400000
  for (let t = start; t <= limit; t += 60000) {
    const d = new Date(t)
    const domOk = doms.has(d.getUTCDate())
    const dowOk = dows.has(d.getUTCDay())
    const dayOk = months.has(d.getUTCMonth() + 1) && (either ? domOk || dowOk : domOk && dowOk)
    if (!dayOk) {
      t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - 60000
      continue
    }
    if (hours.has(d.getUTCHours()) && minutes.has(d.getUTCMinutes())) return d.toISOString()
  }
  return null
}`,
  'devops-cron-next-zone': `
function nextRun(expression: string, after: string, zone: string): string | null {
  const expand = (field: string, min: number, max: number) => {
    const values: number[] = []
    for (const part of field.split(',')) {
      const [range, stepText] = part.split('/')
      const [low, high] = range === '*' ? [min, max] : range.split('-').map(Number)
      const end = range === '*' || range.includes('-') ? high : low
      for (let value = low; value <= end; value += stepText ? Number(stepText) : 1) values.push(value)
    }
    return [...new Set(values)].sort((a, b) => a - b)
  }
  const [minuteField, hourField, domField, monthField, dowField] = expression.split(' ')
  const minutes = expand(minuteField, 0, 59)
  const hours = expand(hourField, 0, 23)
  const doms = expand(domField, 1, 31)
  const months = expand(monthField, 1, 12)
  const dows = expand(dowField, 0, 7).map(day => day % 7)
  const either = !domField.startsWith('*') && !dowField.startsWith('*')
  const format = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
  const fields = (ms: number) => {
    const parts: Record<string, number> = {}
    for (const part of format.formatToParts(new Date(ms))) if (part.type !== 'literal') parts[part.type] = Number(part.value)
    return parts
  }
  const wall = (ms: number) => {
    const p = fields(ms)
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)
  }
  // The earliest instant showing this wall time, or undefined when clocks skip it.
  const firstInstant = (target: number) =>
    [...new Set([-86400000, 0, 86400000].map(shift => wall(target + shift) - (target + shift)))]
      .map(offset => target - offset)
      .filter(instant => wall(instant) === target)
      .sort((a, b) => a - b)[0]
  const from = Date.parse(after)
  const limit = from + 8 * 86400000
  const today = fields(from)
  for (let offset = 0; offset <= 9; offset++) {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset))
    const domOk = doms.includes(date.getUTCDate())
    const dowOk = dows.includes(date.getUTCDay())
    if (!months.includes(date.getUTCMonth() + 1) || !(either ? domOk || dowOk : domOk && dowOk)) continue
    for (const hour of hours)
      for (const minute of minutes) {
        const instant = firstInstant(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour, minute))
        if (instant !== undefined && instant > from && instant <= limit) return new Date(instant).toISOString()
      }
  }
  return null
}`,
  'devops-percentile': `
function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p * sorted.length) / 100)
  return sorted[rank - 1]
}`,
  'devops-error-budget': `
function errorBudget(requests: number, errors: number, targetBasisPoints: number) {
  if (requests === 0) return { allowedErrors: 0, remainingErrors: 0, burnRate: 0 }
  const budget = 10000 - targetBasisPoints
  const allowedErrors = Math.floor((requests * budget) / 10000)
  return {
    allowedErrors,
    remainingErrors: allowedErrors - errors,
    burnRate: Math.floor((errors * 1000000) / (requests * budget)) / 100,
  }
}`,
  'devops-route-latency': `
function slowRoutes(samples: { route: string; ms: number }[], targets: Record<string, number>) {
  const byRoute = new Map<string, number[]>()
  for (const sample of samples) byRoute.set(sample.route, [...(byRoute.get(sample.route) ?? []), sample.ms])
  const report: { route: string; p95: number; target: number }[] = []
  for (const route of Object.keys(targets).sort()) {
    const times = byRoute.get(route)
    if (!times) continue
    const sorted = [...times].sort((a, b) => a - b)
    const p95 = sorted[Math.ceil((95 * sorted.length) / 100) - 1]
    if (p95 > targets[route]) report.push({ route, p95, target: targets[route] })
  }
  return report
}`,
  'devops-burn-alert': `
function burnAlert(
  minutes: { requests: number; errors: number }[],
  policy: { targetBasisPoints: number; longMinutes: number; shortMinutes: number; threshold: number },
) {
  const burn = (window: { requests: number; errors: number }[]) => {
    const requests = window.reduce((sum, minute) => sum + minute.requests, 0)
    const errors = window.reduce((sum, minute) => sum + minute.errors, 0)
    return requests === 0 ? 0 : Math.floor((errors * 1000000) / (requests * (10000 - policy.targetBasisPoints))) / 100
  }
  const longBurn = burn(minutes.slice(-policy.longMinutes))
  const shortBurn = burn(minutes.slice(-policy.shortMinutes))
  return { longBurn, shortBurn, page: longBurn >= policy.threshold && shortBurn >= policy.threshold }
}`,
  'devops-alert-hysteresis': `
function alertEvents(values: number[], policy: { fireAt: number; resolveBelow: number; fireAfter: number; resolveAfter: number }) {
  const events: { at: number; state: string }[] = []
  let firing = false
  let count = 0
  values.forEach((value, at) => {
    const counts = firing ? value < policy.resolveBelow : value >= policy.fireAt
    count = counts ? count + 1 : 0
    if (count >= (firing ? policy.resolveAfter : policy.fireAfter)) {
      firing = !firing
      count = 0
      events.push({ at, state: firing ? 'firing' : 'resolved' })
    }
  })
  return events
}`,
}
