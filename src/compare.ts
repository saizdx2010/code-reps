/** Compare the JSON-shaped values used by authored checks. */
export function sameValue(actual: unknown, expected: unknown, seen = new WeakSet<object>()): boolean {
  // JSON has one zero, so -0 and 0 match; NaN still matches itself.
  if (Object.is(actual, expected) || (actual === 0 && expected === 0)) return true
  if (typeof actual !== 'object' || actual === null || typeof expected !== 'object' || expected === null) return false
  if (seen.has(actual)) return false
  seen.add(actual)
  if (Array.isArray(actual) || Array.isArray(expected)) {
    const result =
      Array.isArray(actual) &&
      Array.isArray(expected) &&
      actual.length === expected.length &&
      // By index, not every(): every() skips holes, so an unfilled slot would match anything.
      Array.from({ length: actual.length }, (_, index) => index).every(
        index => index in actual === index in expected && sameValue(actual[index], expected[index], seen),
      )
    seen.delete(actual)
    return result
  }
  const actualKeys = Object.keys(actual).sort()
  const expectedKeys = Object.keys(expected).sort()
  const result =
    actualKeys.length === expectedKeys.length &&
    actualKeys.every(
      (key, index) =>
        key === expectedKeys[index] &&
        sameValue((actual as Record<string, unknown>)[key], (expected as Record<string, unknown>)[key], seen),
    )
  seen.delete(actual)
  return result
}
