// Type errors reported by the editor's TypeScript service for the current rep. They are advisory and separate from the
// behavioral checks: code can pass every check with a type error, and a clean type check does not prove the brief's
// type requirements.

export type TypeIssue = { file: string; line: number; message: string }

/** Orders issues by file then line and drops exact repeats, which the editor reports when a model is re-validated. */
export function sortTypeIssues(issues: TypeIssue[]): TypeIssue[] {
  const seen = new Set<string>()
  return [...issues]
    .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.message.localeCompare(b.message))
    .filter(issue => {
      const key = `${issue.file}:${issue.line}:${issue.message}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function typeCheckSummary(issues: TypeIssue[] | undefined) {
  if (!issues) return 'Type check unavailable: the code editor has not loaded.'
  if (!issues.length) return 'Type check: no type errors in the editor.'
  return `Type check: ${issues.length} type ${issues.length === 1 ? 'error' : 'errors'} in the editor.`
}
