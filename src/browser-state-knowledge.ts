import type { Skill } from './knowledge.ts'

export const browserStateSkill: Skill = {
  id: 'state-modeling', title: 'Model states with TypeScript unions', summary: 'Keep valid states distinct and narrow before reading their payloads.', prerequisites: ['values'],
  objectives: ['Describe related fields using discriminated unions.', 'Narrow uncertain values rather than assert them.', 'Separate compiler evidence, runtime validation, and behavior.'],
  sections: [
    { title: 'States belong together', body: 'A union describes alternatives. Give each object variant a literal tag such as status: pending or status: ready. Ready can require data while pending has none. Independent optional fields allow combinations you did not intend.' },
    { title: 'Narrow before access', body: 'Checking the tag lets TypeScript know which payload exists. Unknown data still requires runtime validation before becoming a trusted state. An assertion changes what the compiler believes; it does not inspect the value.' },
    { title: 'Generic relationships and derived types', body: 'A generic Load<T> can connect a ready result to its payload type without using any. Pick and Omit can derive a view from a record, but they do not remove fields at runtime. Use these tools when they express a real relationship rather than hiding an unclear model.' },
    { title: 'Check types and behavior separately', body: 'Run a strict semantic compiler check on the complete local project. Vite and the current practice runner transpile code; passing behavioral checks does not prove type correctness. Tests still matter because valid types do not establish correct filtering, ordering, or recovery behavior.' },
  ],
  example: "type Load<T> = {status: 'pending'} | {status: 'ready'; data: T} | {status: 'failed'; error: string}\nfunction total(state: Load<string[]>): number | null {\n  return state.status === 'ready' ? state.data.length : null\n}",
  walkthrough: ['Load<string[]> connects ready data to a string array.', 'Before checking status, data is not available on every variant.', 'Ready with [] returns zero, not null.', 'Pending or failed returns null; no runtime validation is performed by this function.'],
  mistakes: ['Reading variant-specific fields before narrowing.', 'Using any or an assertion to suppress a real mismatch.', 'Treating a successful transpilation as semantic checking.', 'Using optional fields to allow contradictory states.'],
  questions: [
    { id: 'ready-empty-v1', prompt: 'What does total return for ready with data []?', code: "total({status: 'ready', data: []})", options: ['0', 'null', 'undefined'], answer: 0, explanation: 'Ready has data; its empty array has length zero.' },
    { id: 'assertion-v1', prompt: 'What does a type assertion do to unknown JSON?', code: 'const state = JSON.parse(text) as Load<string[]>', options: ['Validates every field', 'Changes compiler assumptions without validating data', 'Removes extra fields'], answer: 1, explanation: 'An assertion does not inspect or transform runtime data. Validate the parsed value before trusting it.' },
  ],
  repIds: ['task-state-label', 'saved-record-status', 'catalog-request-summary'], related: ['validation', 'frontend', 'async'],
}
