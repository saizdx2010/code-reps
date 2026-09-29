import assert from 'node:assert/strict'
import test from 'node:test'
import { runRep } from '../src/runner.ts'
import { aiEraReps } from '../src/ai-era-reps.ts'

const solutions = {
  'verify-generated-code': 'function firstUsefulLabel(labels: string[]): string | null { for (const label of labels) { const trimmed = label.trim(); if (trimmed) return trimmed } return null }',
  'frontend-visible-items': 'function visibleLabels(items: {label: string; active: boolean}[], search: string): string[] { const query = search.trim().toLowerCase(); return items.filter(item => item.active && item.label.toLowerCase().includes(query)).map(item => item.label) }',
  'frontend-view-state': 'function viewState(loading: boolean, error: string | null, count: number): string { if (loading) return "loading"; if (error) return "error"; return count === 0 ? "empty" : "ready" }',
  'backend-validate-user': 'function validateUser(input: unknown) { if (!input || typeof input !== "object" || Array.isArray(input)) return null; const value = input as Record<string, unknown>; if (typeof value.name !== "string" || !value.name.trim() || typeof value.age !== "number" || !Number.isInteger(value.age) || value.age < 0 || value.age > 120) return null; return { name: value.name.trim(), age: value.age } }',
  'backend-page-results': 'function pageIds(ids: string[], page: number, size: number): string[] { const safePage = Math.max(1, page); const safeSize = Math.min(3, Math.max(1, size)); const start = (safePage - 1) * safeSize; return ids.slice(start, start + safeSize) }',
  'interview-frontend': 'function taskTitles(tasks: {title: string; done: boolean; priority: number}[]): string[] { return tasks.filter(task => !task.done).sort((a, b) => b.priority - a.priority).map(task => task.title) }',
  'interview-backend': 'function validateAccess(input: unknown) { if (!input || typeof input !== "object" || Array.isArray(input)) return null; const value = input as Record<string, unknown>; if (typeof value.email !== "string" || (value.role !== "reader" && value.role !== "editor")) return null; const email = value.email.trim().toLowerCase(); const parts = email.split("@"); if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null; return { email, role: value.role } }',
}

test('new authored reps accept a solution matching their stated rules', () => {
  for (const rep of aiEraReps) {
    const results = runRep(solutions[rep.id], rep.id)
    assert.ok(results.every((result) => result.passed), `${rep.id}: ${JSON.stringify(results.filter((result) => !result.passed))}`)
  }
})

test('verification rep exposes the suggested draft mistake', () => {
  const rep = aiEraReps.find((item) => item.id === 'verify-generated-code')
  assert.ok(rep)
  assert.ok(runRep(rep.starter, rep.id).some((result) => !result.passed))
})
