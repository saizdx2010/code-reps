import type { Rep } from './rep.ts'
import type { RepDepth } from './rep-depth.ts'
import type { Skill } from './knowledge.ts'
import type { LessonDepth } from './lesson-depth.ts'

export const browserStateReps: Rep[] = [
  {
    id: 'task-state-label', title: 'Describe a task state', category: 'TypeScript modeling',
    context: 'A task editor has mutually exclusive states. Use the state tag to decide which fields are available.',
    prompt: 'Implement taskLabel(state). For {kind: "draft", title: string}, return "Draft: " followed by the trimmed title, or "Untitled draft" if it is blank. For {kind: "saved", title: string, done: boolean}, return "Done: " or "Open: " followed by the original title. For {kind: "failed", message: string}, return "Error: " followed by the original message.',
    example: { input: 'taskLabel({kind: "draft", title: "  Read  "})', output: '"Draft: Read"' },
    note: 'Inputs satisfy the supplied union type. Titles/messages contain at most 100 basic Latin characters or whitespace. Empty saved titles and error messages remain valid. Do not mutate input. Review narrowing and type correctness yourself; these worker checks assess outputs, not semantic types.',
    vocabulary: [{ term: 'Discriminated union', meaning: 'alternative object shapes identified by a shared field with distinct literal values' }, { term: 'Narrowing', meaning: 'using evidence to determine which type applies in a branch' }],
    planPrompt: 'List the three states and which fields each permits. Trace a blank draft and a saved task with done false.',
    starter: `type TaskState = {kind: 'draft'; title: string} | {kind: 'saved'; title: string; done: boolean} | {kind: 'failed'; message: string}
function taskLabel(state: TaskState): string {
  // Use the written contract for each state.
  return ''
}
`,
    functionName: 'taskLabel', preserveInput: true,
    hints: ['The kind field identifies the variant; not every variant has a title or done field.', 'Branch on kind before reading a variant-specific property. Only draft titles are normalized.', 'For draft use trimmed title or Untitled draft; for saved choose the prefix from done and preserve title; for failed preserve message after Error: .'],
    checks: [
      { name: 'Trims a draft title', input: [{kind: 'draft', title: '  Read  '}], expected: 'Draft: Read' },
      { name: 'Names a blank draft', input: [{kind: 'draft', title: '\t '}], expected: 'Untitled draft' },
      { name: 'Preserves an open saved title', input: [{kind: 'saved', title: ' Read ', done: false}], expected: 'Open:  Read ' },
      { name: 'Describes a completed task', input: [{kind: 'saved', title: 'Read', done: true}], expected: 'Done: Read' },
      { name: 'Preserves a failure message', input: [{kind: 'failed', message: ' Retry '}], expected: 'Error:  Retry ' },
      { name: 'Preserves an empty saved title', input: [{kind: 'saved', title: '', done: false}], expected: 'Open: ' },
      { name: 'Preserves an empty error message', input: [{kind: 'failed', message: ''}], expected: 'Error: ' },
      { name: 'Accepts the maximum title length', input: [{kind: 'saved', title: 'a'.repeat(100), done: true}], expected: 'Done: ' + 'a'.repeat(100) },
    ],
  },
  {
    id: 'saved-record-status', title: 'Describe a journal save result', category: 'TypeScript modeling',
    context: 'A journal reports whether a save was attempted, acknowledged, or rejected. Implement a fresh contract without a solution scaffold.',
    prompt: 'Implement saveStatus(result). For {status: "idle"}, return {text: "Not saved", retry: false}. For {status: "saved", count: number}, return {text: "Saved N books", retry: false}, replacing N with count, including zero and one. For {status: "failed", reason: string, recoverable: boolean}, return {text: reason, retry: recoverable}.',
    example: { input: 'saveStatus({status: "failed", reason: "Storage full", recoverable: true})', output: '{text: "Storage full", retry: true}' },
    note: 'Inputs match the supplied type; count is an integer from 0 through 500. Reason is at most 100 basic Latin characters or whitespace and may be empty. Do not normalize reason, pluralize conditionally, or mutate input. Checks do not establish real storage behavior or semantic type correctness.',
    vocabulary: [{ term: 'Acknowledgement', meaning: 'confirmation that an operation succeeded' }, { term: 'Recoverable', meaning: 'a failure for which the contract permits another attempt' }],
    planPrompt: 'Restate the output for every allowed input shape. Predict zero count and a nonrecoverable error before coding.',
    starter: `type SaveResult = {status: 'idle'} | {status: 'saved'; count: number} | {status: 'failed'; reason: string; recoverable: boolean}
function saveStatus(result: SaveResult): {text: string; retry: boolean} {
  return {text: '', retry: false}
}
`,
    functionName: 'saveStatus', preserveInput: true,
    hints: ['Each input variant has its own output rule. Preserve false and zero as valid values.', 'Use the status tag to determine which properties exist. Only failed results supply the retry decision.', 'Handle idle and saved before returning the failed reason and recoverable flag. Saved always uses the literal suffix books.'],
    checks: [
      { name: 'Describes no save attempt', input: [{status: 'idle'}], expected: {text: 'Not saved', retry: false} },
      { name: 'Reports a normal save', input: [{status: 'saved', count: 4}], expected: {text: 'Saved 4 books', retry: false} },
      { name: 'Preserves zero count', input: [{status: 'saved', count: 0}], expected: {text: 'Saved 0 books', retry: false} },
      { name: 'Uses the literal suffix for one', input: [{status: 'saved', count: 1}], expected: {text: 'Saved 1 books', retry: false} },
      { name: 'Reports the maximum count', input: [{status: 'saved', count: 500}], expected: {text: 'Saved 500 books', retry: false} },
      { name: 'Allows recoverable failure retry', input: [{status: 'failed', reason: ' Full ', recoverable: true}], expected: {text: ' Full ', retry: true} },
      { name: 'Preserves an empty nonrecoverable reason', input: [{status: 'failed', reason: '', recoverable: false}], expected: {text: '', retry: false} },
      { name: 'Allows retry with an empty reason', input: [{status: 'failed', reason: '', recoverable: true}], expected: {text: '', retry: true} },
      { name: 'Rejects retry despite a nonempty reason', input: [{status: 'failed', reason: 'Blocked', recoverable: false}], expected: {text: 'Blocked', retry: false} },
    ],
  },
  {
    id: 'catalog-request-summary', title: 'Summarize catalog request outcomes', category: 'TypeScript modeling',
    context: 'An inspection panel summarizes multiple catalog requests. Return later to apply state modeling to an ordered collection.',
    prompt: 'Implement requestSummary(requests). Each request is {status: "pending", id: string}, {status: "ready", id: string, titles: string[]}, or {status: "failed", id: string, error: string}. Return {pending: string[], empty: string[], errors: {id: string, message: string}[]}. pending contains pending IDs, empty contains ready IDs whose titles array is empty, and errors contains each failed ID and its error as message. Preserve input order within each output array and repeated IDs. Ready requests with titles contribute nothing.',
    example: { input: 'requestSummary([{status: "ready", id: "b", titles: []}, {status: "pending", id: "a"}])', output: '{pending: ["a"], empty: ["b"], errors: []}' },
    note: 'At most 100 requests and 100 titles per ready request. Strings contain at most 100 basic Latin characters or whitespace, including empty strings. Inputs match the union type. Do not trim, deduplicate, mutate input, or interpret a blank title as an empty array. This checks a summary of supplied states, not promise execution or semantic typing.',
    vocabulary: [{ term: 'Variant', meaning: 'one permitted shape in a union' }, { term: 'Ordered collection', meaning: 'values whose relative positions matter to the contract' }],
    planPrompt: 'Predict a mixed input with repeated IDs and a ready request containing one blank title. Explain which output entries should appear.',
    starter: `type CatalogRequest = {status: 'pending'; id: string} | {status: 'ready'; id: string; titles: string[]} | {status: 'failed'; id: string; error: string}
function requestSummary(requests: CatalogRequest[]): {pending: string[]; empty: string[]; errors: {id: string; message: string}[]} {
  return {pending: [], empty: [], errors: []}
}
`,
    functionName: 'requestSummary', preserveInput: true,
    hints: ['Decide independently whether each request contributes to an output array. An empty array and an array with an empty string differ.', 'Inspect each status before accessing titles or error. Append entries in encounter order.', 'Accumulate pending IDs, ready IDs only when titles.length is zero, and failed {id, message: error} records in separate arrays. Keep duplicates.'],
    checks: [
      { name: 'Handles no requests', input: [[]], expected: {pending: [], empty: [], errors: []} },
      { name: 'Summarizes the example', input: [[{status: 'ready', id: 'b', titles: []}, {status: 'pending', id: 'a'}]], expected: {pending: ['a'], empty: ['b'], errors: []} },
      { name: 'Separates mixed outcomes in order', input: [[{status: 'failed', id: 'x', error: ' Offline '}, {status: 'pending', id: 'z'}, {status: 'ready', id: 'n', titles: ['A']}, {status: 'failed', id: 'y', error: ''}]], expected: {pending: ['z'], empty: [], errors: [{id: 'x', message: ' Offline '}, {id: 'y', message: ''}]} },
      { name: 'Keeps repeated pending IDs', input: [[{status: 'pending', id: 'x'}, {status: 'pending', id: 'x'}]], expected: {pending: ['x', 'x'], empty: [], errors: []} },
      { name: 'A blank title is not an empty result', input: [[{status: 'ready', id: '', titles: ['']}]], expected: {pending: [], empty: [], errors: []} },
      { name: 'Keeps repeated empty IDs', input: [[{status: 'ready', id: 'x', titles: []}, {status: 'ready', id: 'x', titles: []}]], expected: {pending: [], empty: ['x', 'x'], errors: []} },
      { name: 'Handles the request limit without collapsing IDs', input: [Array.from({length: 100}, () => ({status: 'pending', id: 'a'}))], expected: {pending: Array(100).fill('a'), empty: [], errors: []} },
    ],
  },
]

export const browserStateGuides = {
  'task-state-label': { plan: ['Identify the tag and fields for each variant.', 'Normalize only the draft title.'], explanation: ['Trace blank and saved labels.', 'Separate output evidence from type-check evidence.'], example: 'Checking kind narrows the state before I access its fields. Draft trimming is a contract rule, not a rule for saved labels. Worker output checks do not prove narrowing; I also run a strict compiler check outside the app.' },
  'saved-record-status': { plan: ['Restate all result shapes.', 'Preserve zero, false, and literal reason text.'], explanation: ['Explain why saved and failed fields differ.', 'Distinguish a supplied result from a real write acknowledgement.'], example: 'I use status to decide which payload exists, preserving recoverable rather than inferring it from reason text. Zero saved books is still success. This rep consumes a result and cannot prove the storage operation happened.' },
  'catalog-request-summary': { plan: ['Predict separate output sequences.', 'Distinguish empty titles from a blank title.'], explanation: ['Trace repeated IDs and mixed variants.', 'Explain why summary checks do not test real async ownership.'], example: 'Each request contributes according to status. A ready request contributes an empty ID only when titles has length zero. Appending preserves encounter order and duplicates. The supplied snapshots do not establish promise execution.' },
}

export const browserStateDepth: Record<string, RepDepth> = {
  'task-state-label': { reasoning: 'The tag chooses the only valid payload. Each branch returns the exact prefix and applies normalization only where specified.', trace: 'A draft title containing a tab and space trims to empty and becomes Untitled draft. A saved title with those characters retains them after Open: .', alternative: 'A single object with optional done, title, and message permits contradictory combinations. A union encodes which fields belong together; compiler analysis, not output checks, assesses that difference.', counterexample: 'Trimming every title changes saved title " Read " into "Read", violating presentation preservation.', transfer: 'Self-review: add an archived variant with a date. Which callers and branches require updating, and how would exhaustive checking expose omissions?' },
  'saved-record-status': { reasoning: 'The status separates acknowledgement from failure. retry is a supplied policy, not guessed from count or reason.', trace: 'Saved count zero produces Saved 0 books and retry false. Failed reason empty with recoverable true produces empty text and retry true.', alternative: 'Separate helper functions can format each payload, but callers still need a trustworthy discriminator. Truthiness shortcuts lose zero and empty-string cases.', counterexample: 'Using Boolean(reason) to allow retry rejects an empty recoverable reason and accepts a nonrecoverable nonempty reason.', transfer: 'Self-review: introduce a saving state while retaining the previous saved count. Define what is acknowledged versus pending before changing the type.' },
  'catalog-request-summary': { reasoning: 'After each visit, each output contains exactly the qualifying entries from the visited prefix in their original order. Different variants cannot contribute fields they do not have.', trace: 'Ready x with [] adds x to empty; ready x with [""] adds nothing; a later pending x adds x to pending. Duplicate identity does not collapse supplied snapshots.', alternative: 'Three filter/map passes are still O(n) for bounded per-record work, but repeat traversal. A single traversal uses O(n) output space and preserves each order explicitly.', counterexample: 'A Set collapses repeated pending IDs. Testing titles.every(t => !t) falsely classifies [""] as empty.', transfer: 'Self-review: summarize only the last snapshot for each ID. Specify order and conflict rules before choosing storage; the original checks do not validate this new contract.' },
}

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
  repIds: browserStateReps.map(rep => rep.id), related: ['validation', 'frontend', 'async'],
}

export const browserStateLessonDepth: LessonDepth = {
  title: 'Make contradictions visible', code: "type Loose = {loading: boolean; data?: string[]; error?: string}\nconst contradictory: Loose = {loading: true, data: ['Old'], error: 'Failed'}",
  reasoning: 'This type permits all three fields together without defining precedence. A union can make mutually exclusive phases explicit; a refresh policy that retains old data requires a deliberately different model.',
  challenge: 'Describe a union for pending, ready, and failed. Then decide how refreshing with old data differs. Which cases must the DOM render?',
  answer: 'Pending needs a tag, ready requires data, and failed requires an error. Refreshing can require previous data and a distinct tag. Failed refresh may also retain previous data if the authored policy says so. There is no universal model independent of the display contract.',
}
