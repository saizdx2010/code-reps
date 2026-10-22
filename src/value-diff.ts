import { sameValue } from './compare.ts'

/**
 * One plain sentence saying how a received value differs from the expected one, for a failed check.
 * It describes the values only and never suggests a change to the code. Both values arrive as the JSON text the
 * runner formats; anything that is not JSON (or that reads back the same) gets no sentence.
 */
export function describeDifference(expected: string, actual: string): string | null {
  if (actual === 'undefined') return expected === 'undefined' ? null : 'Received undefined: the function returned no value.'
  const want = parse(expected)
  const got = parse(actual)
  if (!want.ok || !got.ok || sameValue(got.value, want.value)) return null
  return describe(want.value, got.value)
}

const parse = (text: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

type Kind = 'array' | 'object' | 'null' | 'string' | 'number' | 'boolean'
const kindOf = (value: unknown): Kind =>
  Array.isArray(value) ? 'array' : value === null ? 'null' : (typeof value as Exclude<Kind, 'array' | 'null'>)
const article = (kind: Kind) =>
  ({ array: 'a list', object: 'an object', null: 'null', string: 'text', number: 'a number', boolean: 'true or false' })[kind]

/** A value as it appears in the drawer, shortened so a sentence stays one line. */
export const show = (value: unknown, limit = 40) => {
  const text = JSON.stringify(value) ?? String(value)
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text
}
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
// Floating-point noise (0.1 + 0.2) stays readable: twelve significant digits.
const tidy = (value: number) => Number(value.toPrecision(12))

// Where a nested difference sits, in the code's own notation: [0].value. Plain keys use a dot; others use brackets.
const keyPath = (path: string, key: string) =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? (path ? `${path}.${key}` : key) : `${path}[${JSON.stringify(key)}]`
const at = (path: string, sentence: string) => (path ? `At ${path}: ${sentence}` : sentence)

/** Follows the first difference down through lists and objects, so the sentence names the exact place and values. */
function describe(want: unknown, got: unknown, path = ''): string {
  const wantKind = kindOf(want)
  const gotKind = kindOf(got)
  if (wantKind !== gotKind) return at(path, `Expected ${article(wantKind)}, received ${article(gotKind)}: ${show(got)}.`)
  if (wantKind === 'array') return describeArrays(want as unknown[], got as unknown[], path)
  if (wantKind === 'object') return describeObjects(want as Record<string, unknown>, got as Record<string, unknown>, path)
  if (wantKind === 'string') return at(path, describeStrings(want as string, got as string))
  if (wantKind === 'number') return at(path, describeNumbers(want as number, got as number))
  return at(path, `Expected ${show(want)}, received ${show(got)}.`)
}

function describeNumbers(want: number, got: number): string {
  const gap = tidy(Math.abs(got - want))
  if (gap <= 1e-9 * Math.max(1, Math.abs(want), Math.abs(got)))
    return `Expected ${want}, received ${got}: they differ only by floating-point rounding.`
  return `Expected ${want}, received ${got}: ${gap} ${got > want ? 'more' : 'less'} than expected.`
}

function describeStrings(want: string, got: string): string {
  const wantChars = [...want]
  const gotChars = [...got]
  if (want.toLowerCase() === got.toLowerCase()) return 'Same letters, different capitalization.'
  if (want.trim() === got.trim()) return 'Same text apart from spaces at the start or end.'
  const shared = wantChars.findIndex((char, index) => char !== gotChars[index])
  if (shared === -1)
    return `${plural(gotChars.length - wantChars.length, 'extra character')} at the end: ${show(gotChars.slice(wantChars.length).join(''))}.`
  if (shared >= gotChars.length)
    return `${plural(wantChars.length - gotChars.length, 'character')} missing at the end: ${show(wantChars.slice(gotChars.length).join(''))}.`
  return `Differs at character ${shared + 1}: ${show(wantChars[shared])} expected, ${show(gotChars[shared])} received.`
}

function describeArrays(want: unknown[], got: unknown[], path: string): string {
  const firstDiff = want.findIndex((item, index) => index >= got.length || !sameValue(got[index], item))
  if (got.length > want.length && firstDiff === -1) {
    const extra = got.slice(want.length)
    return at(
      path,
      extra.length === 1
        ? `1 extra item at index ${want.length}: ${show(extra[0])}.`
        : `${extra.length} extra items from index ${want.length}: ${show(extra)}.`,
    )
  }
  if (got.length < want.length && firstDiff === got.length) {
    const missing = want.slice(got.length)
    return at(
      path,
      missing.length === 1
        ? `1 item missing at index ${got.length}: ${show(missing[0])}.`
        : `${missing.length} items missing from index ${got.length}: ${show(missing)}.`,
    )
  }
  if (got.length === want.length && sameItems(want, got)) return at(path, 'Same items, in a different order.')
  if (got.length !== want.length)
    return at(path, `Expected ${plural(want.length, 'item')}, received ${got.length}; the first difference is at index ${firstDiff}.`)
  const differing = want.filter((item, index) => !sameValue(got[index], item)).length
  const more = differing > 1 ? ` ${plural(differing - 1, 'more item')} ${differing === 2 ? 'differs' : 'differ'} too.` : ''
  return `${describe(want[firstDiff], got[firstDiff], `${path}[${firstDiff}]`)}${more}`
}

const sameItems = (want: unknown[], got: unknown[]) => {
  const key = (items: unknown[]) => items.map(item => JSON.stringify(item)).sort()
  return sameValue(key(want), key(got))
}

function describeObjects(want: Record<string, unknown>, got: Record<string, unknown>, path: string): string {
  const missing = Object.keys(want).filter(key => !(key in got))
  const extra = Object.keys(got).filter(key => !(key in want))
  const quote = (keys: string[]) => keys.map(key => `“${key}”`).join(', ')
  if (missing.length || extra.length) {
    const parts = [
      missing.length ? `${missing.length === 1 ? 'Key' : 'Keys'} ${quote(missing)} ${missing.length === 1 ? 'is' : 'are'} missing` : '',
      extra.length ? `${quote(extra)} ${extra.length === 1 ? 'was' : 'were'} not expected` : '',
    ].filter(Boolean)
    return at(path, `${parts.join('; ')}.`)
  }
  const key = Object.keys(want).find(name => !sameValue(got[name], want[name]))!
  return describe(want[key], got[key], keyPath(path, key))
}
