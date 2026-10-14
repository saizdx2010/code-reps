import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const fluencyGuides: Record<string, ReflectionGuide> = {
  'sum-matching-prices': {
    plan: ['What does your accumulator mean after each item?', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'I add the price of each available entry once. Duplicate entries count separately. One scan is O(n) time with O(1) working space.',
  },
  'count-open-tickets': {
    plan: ['State the two conditions and an equality boundary.', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example: 'I count only open tickets with priority >= minimum. Equality qualifies. A loop uses O(n) time and O(1) extra space.',
  },
  'first-label-ending': {
    plan: ['How will you separate comparison from display?', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example: 'I normalize comparison text but return the original first matching label. Work includes the text visited.',
  },
  'count-label-prefix': {
    plan: ['What happens when the prefix or label is blank?', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'I reject blank labels, then compare normalized prefixes. Duplicates are separate inputs. Cost includes total label text processed.',
  },
  'first-duplicate-label': {
    plan: ['Trace the second occurrence, not the first position.', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'I scan normalized nonblank labels and return when membership is already true. The first repeated occurrence decides the answer. Storage grows with distinct labels.',
  },
  'count-statuses': {
    plan: ['Which fields must exist even for empty input?', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example: 'I initialize both counters and increment the matching field for each item. O(n) time and O(1) extra space.',
  },
  'count-record-highs': {
    plan: ['What does the value you keep mean after each reading?', 'Predict an all-negative input and a tie with the record.'],
    explanation: [
      'Explain why the comparison is with the best earlier reading, not the previous one.',
      'State time and storage costs for your chosen implementation.',
    ],
    example:
      'I keep the highest reading so far, starting from no reading rather than 0. A reading counts only when it is strictly greater, and then it becomes the record. One scan is O(n) time with O(1) extra space.',
  },
  'first-pair-to-target': {
    plan: ['What must you already know when you reach position j?', 'Predict a single value and two equal values that reach the target.'],
    explanation: [
      'Explain how your order of lookup and storage prevents a value pairing with itself.',
      'Explain how your scan guarantees the smallest j, then the smallest i.',
      'State time and storage costs for your chosen implementation.',
    ],
    example:
      'I scan j from left to right with a Map from value to its earliest position. Before storing values[j], I look up target - values[j]; a hit is the answer with the smallest j, and the stored position is the smallest i. That is O(n) expected time and O(n) storage, compared with O(n²) for checking every pair.',
  },
  'remaining-actions': {
    plan: ['Trace saved actions and an undo when none remain.', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example: 'I push ordinary actions and pop for UNDO. Each action is visited once. The output stack uses O(n) space.',
  },
  'cancel-adjacent-ids': {
    plan: ['Trace the cascade in [1,2,2,1,3].', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'A stack resolves newly adjacent pairs without rescanning. Each ID is pushed or cancels a top once: O(n) time and O(n) output storage.',
  },
  'validate-page-query': {
    plan: ['Separate shape, type, and boundary validation.', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'I guard shape then check integers and inclusive limits. I return only trusted fields in a new object. O(1) time and extra space.',
  },
  'derive-task-summary': {
    plan: ['Distinguish all unfinished tasks from visible unfinished tasks.', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'I derive pending tasks, count them, then derive matching titles. Search does not change the overall remaining count. O(n) visits plus string work; derived arrays use O(n) space.',
  },
  'debug-page-offset': {
    plan: ['Write expected and actual positions before repairing the offset.', 'Name an empty or boundary input before coding.'],
    explanation: ['Explain how the contract is preserved.', 'State time and storage costs for your chosen implementation.'],
    example:
      'The original start page * size skips the first page. I use (page - 1) * size and slice to start + size. Copying up to size IDs uses proportional output space.',
  },
}

export const fluencyDepth: Record<string, RepDepth> = {
  'sum-matching-prices': {
    reasoning: 'The total summarizes all available entries, including repeated records.',
    trace: 'Available prices [100,100] contribute 200 even if IDs repeat; an unavailable price 50 contributes nothing.',
    alternative:
      'A loop avoids an intermediate array; filter then reduce can separate selection from addition. Neither should deduplicate.',
    counterexample: 'Converting entries to a Set by ID undercounts repeated available entries.',
    transfer: 'Group available totals by category. Explain the Map state needed after every visit.',
  },
  'count-open-tickets': {
    reasoning: 'Both status and inclusive priority conditions must hold for each counted record.',
    trace: 'With minimum -1, an open ticket at -1 counts, a closed ticket at 10 does not, and an open ticket at -2 does not.',
    alternative: 'A conjunction is concise; sequential guards can make each rejection reason clearer. Both use constant working storage.',
    counterexample: 'Using OR counts closed high-priority tickets and low-priority open ones.',
    transfer: 'Add an optional assignee filter and derive cases that distinguish AND from OR.',
  },
  'first-label-ending': {
    reasoning: 'Normalize comparisons without replacing the original value returned to the caller.',
    trace: 'A label Report.TS with spaces matches ending .ts after trim and lowercase; return the original spaced label.',
    alternative:
      'A loop stops on the first match; filtering all candidates is unnecessary. includes would implement a different relationship.',
    counterexample: 'Using includes accepts file.ts.backup for ending .ts even though the suffix does not match.',
    transfer: 'Return the last match instead and explain how stopping behavior changes.',
  },
  'count-label-prefix': {
    reasoning: 'Blank labels are excluded even when a blank prefix matches all useful text.',
    trace: 'For [spaces,Ada with spaces,ada], blank prefix counts 2; prefix AD with spaces also counts 2.',
    alternative: 'Normalize the prefix once instead of per label. A loop counts without storing matching labels.',
    counterexample: 'A raw startsWith check misses surrounding spaces and case differences; deduplication loses repeated entries.',
    transfer: 'Group counts by the first normalized letter, deciding what to do with blank labels.',
  },
  'first-duplicate-label': {
    reasoning: 'Membership is based on trimmed case-sensitive text and the second-occurrence rule.',
    trace: 'For [Ada with spaces,Bo,Ada], save Ada then Bo; the final Ada is a repeat and returns trimmed Ada.',
    alternative: 'A Set scan stops early; frequency counting followed by original-order selection may choose a different repeated label.',
    counterexample: 'Lowercasing collapses Ada and ada even though this contract distinguishes them.',
    transfer: 'Make comparisons case-insensitive but return the first original display label. What additional mapping is needed?',
  },
  'count-statuses': {
    reasoning: 'Initialize the full response shape so absence of occurrences is still represented.',
    trace: 'For [open,closed,open], counts progress to {open:2,closed:1}; [] stays {open:0,closed:0}.',
    alternative: 'Two fixed counters suit a closed set of statuses; a Map is more flexible when categories are dynamic.',
    counterexample: 'Adding keys only when observed omits closed for [open], breaking the promised shape.',
    transfer: 'Add a third allowed status and list the type, initialization, and tests that must change.',
  },
  'count-record-highs': {
    reasoning:
      'After each reading, the record is the largest value seen so far, and the count is how many times that record was strictly raised. A reading beats every earlier reading exactly when it beats their maximum.',
    trace:
      'For [1, 5, 2, 3, 4], 1 and 5 set records. 2, 3, and 4 are each below 5, so the answer is 2 even though 3 and 4 rise from their neighbours.',
    traceSteps: {
      code: [
        'function countRecords(readings: number[]): number {',
        '  let record = -Infinity',
        '  let count = 0',
        '  for (const reading of readings) {',
        '    if (reading > record) {',
        '      record = reading',
        '      count++',
        '    }',
        '  }',
        '  return count',
        '}',
      ],
      input: 'readings = [1, 5, 2, 3, 4]',
      steps: [
        {
          line: 2,
          vars: { record: '-Infinity', count: 0 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4] },
          note: 'Start below every possible reading, so the first one always sets a record, even a negative one.',
        },
        {
          line: 6,
          vars: { reading: 1, record: 1, count: 1 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4], pointers: { reading: 0 } },
          note: '1 beats -Infinity: the first record.',
        },
        {
          line: 6,
          vars: { reading: 5, record: 5, count: 2 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4], pointers: { reading: 1 }, dimmed: [0] },
          note: '5 beats the record 1, so 5 becomes the record.',
        },
        {
          line: 4,
          vars: { reading: 2, record: 5, count: 2 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4], pointers: { reading: 2 }, dimmed: [0, 1] },
          note: '2 is below 5. Nothing changes.',
        },
        {
          line: 4,
          vars: { reading: 3, record: 5, count: 2 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4], pointers: { reading: 3 }, dimmed: [0, 1, 2] },
          note: '3 rises from 2, but it does not beat 5. Comparing with the previous reading would count it wrongly.',
        },
        {
          line: 4,
          vars: { reading: 4, record: 5, count: 2 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4], pointers: { reading: 4 }, dimmed: [0, 1, 2, 3] },
          note: '4 is also below the record 5.',
        },
        {
          line: 9,
          vars: { result: 2 },
          structure: { kind: 'array', values: [1, 5, 2, 3, 4], dimmed: [0, 1, 2, 3, 4] },
          note: 'Two readings set records: 1 and 5.',
        },
      ],
    },
    alternative:
      'Comparing each reading with every earlier reading also works but costs O(n²) time. Keeping only the maximum is enough, because beating the maximum means beating everything before it.',
    counterexample:
      'Starting the record at 0 returns 0 for [-5, -7]; the first reading must always count. Using >= counts the ties in [2, 2, 2] as three records.',
    transfer:
      'Return the positions of the record highs instead of their count, or count record lows as well. Decide what a tie means for each. This changed contract is self-reviewed.',
  },
  'first-pair-to-target': {
    reasoning:
      'When the scan reaches j, the Map holds every earlier value with its earliest position. If target - values[j] is present, no smaller j had a pair, because the scan would already have returned, and the stored position is the smallest i for this j.',
    trace:
      'For [3, 3, 1, 3] and target 4: 3 needs 1 (absent), store 3→0; the second 3 needs 1, keep 3→0; 1 needs 3, found at 0, so return [0, 2].',
    traceSteps: {
      code: [
        'function firstPair(values: number[], target: number): [number, number] | null {',
        '  const earliest = new Map<number, number>()',
        '  for (let j = 0; j < values.length; j++) {',
        '    const i = earliest.get(target - values[j])',
        '    if (i !== undefined) return [i, j]',
        '    if (!earliest.has(values[j])) earliest.set(values[j], j)',
        '  }',
        '  return null',
        '}',
      ],
      input: 'values = [3, 3, 1, 3], target = 4',
      steps: [
        {
          line: 1,
          vars: { target: 4 },
          structure: { kind: 'map', entries: [] },
          note: 'The Map will hold each value already visited with the first position where it appeared.',
        },
        {
          line: 3,
          vars: { j: 0, needed: 1, i: null },
          structure: { kind: 'map', entries: [] },
          note: 'values[0] is 3, so its partner must be 4 - 3 = 1. Nothing is stored yet, so there is no pair.',
        },
        {
          line: 5,
          vars: { j: 0 },
          structure: { kind: 'map', entries: [['3', 0]] },
          note: 'Store 3 only after the lookup. Storing first would let 2 pair with itself when target is 4.',
        },
        {
          line: 5,
          vars: { j: 1, needed: 1, i: null },
          structure: { kind: 'map', entries: [['3', 0]] },
          note: 'The second 3 also needs 1, which is still absent. 3 is already stored, so position 0 is kept as the earliest.',
        },
        {
          line: 3,
          vars: { j: 2, needed: 3, i: 0 },
          structure: { kind: 'map', entries: [['3', 0]] },
          note: 'values[2] is 1 and needs 3. The Map gives position 0, not 1, because it kept the earliest 3.',
        },
        {
          line: 4,
          vars: { result: '[0,2]' },
          structure: { kind: 'map', entries: [['3', 0]] },
          note: 'Return [0, 2]. No smaller j had a pair, or the scan would have returned already. The last 3 is never visited.',
        },
      ],
    },
    alternative:
      'Checking every pair with two nested loops, j outer and i inner, is easy to verify and uses O(1) extra space but O(n²) time. Sorting loses the original positions, and a two-pointer scan does not choose the smallest j.',
    counterexample:
      'Storing values[j] before the lookup pairs 3 with itself in [3] when target is 6. Overwriting the stored position returns [1, 2] instead of [0, 2] for [3, 3, 1, 3].',
    transfer:
      'Return every pair with the smallest j, or count all pairs instead. Decide what each needs to store. This changed contract is self-reviewed.',
  },
  'remaining-actions': {
    reasoning: 'The stack contains the surviving actions after processing the visited instructions.',
    trace: 'For [A,B,UNDO,C], save A, save B, remove B, save C; return [A,C]. UNDO on an empty stack does nothing.',
    traceSteps: {
      code: [
        'function remainingActions(actions: string[]): string[] {',
        '  const stack: string[] = []',
        '  for (const action of actions) {',
        "    if (action === 'UNDO') stack.pop()",
        '    else stack.push(action)',
        '  }',
        '  return stack',
        '}',
      ],
      input: "actions = ['A', 'UNDO', 'UNDO', 'B', 'C', 'UNDO', 'D']",
      steps: [
        { line: 1, vars: { stack: '[]' }, structure: { kind: 'stack', values: [] }, note: 'Start with no saved actions.' },
        { line: 2, vars: { action: 'A', stack: '[]' }, structure: { kind: 'stack', values: [] }, note: 'Read A. Nothing is saved yet.' },
        {
          line: 4,
          vars: { action: 'A', stack: '[A]' },
          structure: { kind: 'stack', values: ['A'] },
          note: 'A is not UNDO, so it is saved.',
        },
        { line: 2, vars: { action: 'UNDO', stack: '[A]' }, structure: { kind: 'stack', values: ['A'] }, note: 'Read the first UNDO.' },
        {
          line: 3,
          vars: { action: 'UNDO', stack: '[]' },
          structure: { kind: 'stack', values: [] },
          note: 'UNDO removes the most recent saved action, A.',
        },
        {
          line: 3,
          vars: { action: 'UNDO', stack: '[]' },
          structure: { kind: 'stack', values: [] },
          note: 'A second UNDO with nothing saved does nothing. The stack stays empty.',
        },
        { line: 4, vars: { action: 'B', stack: '[B]' }, structure: { kind: 'stack', values: ['B'] }, note: 'B is saved.' },
        { line: 4, vars: { action: 'C', stack: '[B, C]' }, structure: { kind: 'stack', values: ['B', 'C'] }, note: 'C is saved above B.' },
        {
          line: 3,
          vars: { action: 'UNDO', stack: '[B]' },
          structure: { kind: 'stack', values: ['B'] },
          note: 'UNDO removes C, the most recent saved action.',
        },
        { line: 4, vars: { action: 'D', stack: '[B, D]' }, structure: { kind: 'stack', values: ['B', 'D'] }, note: 'D is saved above B.' },
        {
          line: 6,
          vars: { result: '["B", "D"]' },
          structure: { kind: 'stack', values: ['B', 'D'] },
          note: 'The stack holds the surviving actions in their original order, so the function returns B and D.',
        },
      ],
    },
    alternative: 'A stack handles the latest action directly. Filtering UNDO tokens removes commands but fails to undo their targets.',
    counterexample: 'Treating a blank action as absent loses a legitimate saved action; only exact UNDO is a command.',
    transfer: 'Add REDO. Explain which additional history and invalidation rules are needed.',
  },
  'cancel-adjacent-ids': {
    reasoning: 'The stack is the reduced prefix, not a set of all IDs seen.',
    trace: 'For [1,2,2,1], push 1 and 2, pop 2, then pop 1; return [].',
    alternative: 'A stack is one pass with output-proportional storage. Repeated pair deletion can rescan the list.',
    counterexample: 'Global duplicate removal loses nonadjacent [1,2,1], which must remain unchanged.',
    transfer: 'Return the removed pairs as an audit trail while preserving the final remainder.',
  },
  'validate-page-query': {
    reasoning: 'Rejection differs from clamping: invalid caller input must not become a successful request.',
    trace: '{page:1,size:50,extra:true} returns a fresh {page:1,size:50}; size 51, size as text, and null fail.',
    alternative:
      'Explicit guards expose limits; a reusable runtime schema helps repeated contracts. Neither should coerce unless requested.',
    counterexample: 'Clamping size 51 to 50 accepts a request that must return null.',
    transfer: 'Contrast this validator with backend-page-results, naming one input whose policy differs.',
  },
  'derive-task-summary': {
    reasoning: 'The remaining count describes all unfinished tasks, not just the visible subset.',
    trace:
      'With two unfinished tasks and a query matching only one, return one title and remaining 2; completed matches contribute neither.',
    alternative:
      'One loop can count and select; separate derivations may read more clearly. Avoid storing derived values that can drift from inputs.',
    counterexample: 'Counting selected titles as remaining reports 1 instead of 2 when the query hides work.',
    transfer: 'Add a completed count without storing another independently mutable list.',
  },
  'debug-page-offset': {
    traceSteps: {
      code: [
        'function pageWindow(ids: string[], page: number, size: number): string[] {',
        '  // Bug: start = page * size; slice(start, size) treats size as an end',
        '  const start = (page - 1) * size',
        '  const end = start + size',
        '  const window = ids.slice(start, end)',
        '  return window',
        '}',
      ],
      input: 'ids = ["a", "b", "c", "d", "e"], page = 2, size = 2',
      steps: [
        {
          line: 0,
          vars: { page: 2, size: 2 },
          structure: { kind: 'array', values: ['a', 'b', 'c', 'd', 'e'] },
          note: 'Page 2 of size 2 should hold the third and fourth IDs: c and d.',
        },
        {
          line: 1,
          vars: { buggyStart: 4, buggyEnd: 2 },
          structure: { kind: 'array', values: ['a', 'b', 'c', 'd', 'e'], pointers: { 'buggy start': 4 } },
          note: 'The original code starts at 2 * 2 = 4 and ends at size 2. An end before the start gives an empty slice.',
        },
        {
          line: 2,
          vars: { start: 2 },
          structure: { kind: 'array', values: ['a', 'b', 'c', 'd', 'e'], pointers: { start: 2 } },
          note: 'Subtract one to convert the one-based page to a zero-based offset: (2 - 1) * 2 = 2.',
        },
        {
          line: 3,
          vars: { start: 2, end: 4 },
          structure: { kind: 'array', values: ['a', 'b', 'c', 'd', 'e'], pointers: { start: 2, end: 4 } },
          note: 'The end is a position, not a length: start + size = 4. slice excludes it, so e stays out.',
        },
        {
          line: 4,
          vars: { start: 2, end: 4, window: '["c","d"]' },
          structure: { kind: 'array', values: ['a', 'b', 'c', 'd', 'e'], pointers: { start: 2, end: 4 }, dimmed: [0, 1, 4] },
          note: 'slice copies positions 2 and 3 without changing ids. Page 1 would end at 2, so there is no gap or overlap.',
        },
        {
          line: 5,
          vars: { result: '["c","d"]' },
          structure: { kind: 'array', values: ['a', 'b', 'c', 'd', 'e'], dimmed: [0, 1, 4] },
          note: 'Return the copy. On page 3, start 4 and end 6 would return ["e"]: slice stops at the array’s end.',
        },
      ],
    },
    reasoning: 'Translate one-based page numbers into zero-based positions before slicing.',
    trace: 'For [a,b,c,d,e], page 1 size 2 starts at 0 and returns [a,b]; page 2 starts at 2 and returns [c,d].',
    alternative:
      'slice expresses a nonmutating page copy; splice changes the caller-owned array. A loop can copy but needs correct boundaries.',
    counterexample: 'page * size starts page 1 at 2 and skips the first two IDs.',
    transfer: 'Write adjacent-page cases showing no gaps or overlap, including a partial last page.',
  },
}
