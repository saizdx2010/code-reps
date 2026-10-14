import type { Rep } from './rep-types.ts'
import type { AsyncFixtureSpec } from './async-fixture.ts'

const fixtureTypes = `type Fixture = {
  fetch: (id: string, signal?: AbortSignal) => Promise<string>
  readonly signal: AbortSignal
  release: () => void
}
`
const jobs = [
  { id: 'a', value: ' Ada ' },
  { id: 'b', value: '' },
  { id: 'bad', value: '', error: 'Unavailable' },
]
const check = (name: string, ids: string[], expected: unknown, events: string[], abort?: AsyncFixtureSpec['abort']) => ({
  name,
  input: [ids],
  expected,
  fixture: { jobs, events, abort },
})
const note =
  'Runtime behavior check: the harness supplies fixture as the last argument. fetch(id, signal?) returns a real Promise that settles in a later microtask; no network or timer wait occurs. IDs are exact strings from the supplied fixture catalog. Inputs contain 0–20 IDs, including repeats. Values and error messages are preserved exactly. Do not mutate the IDs. Checks observe fetch calls, settlement order, and release calls as well as the returned value. Passing does not prove production timing, network integration, or a particular syntax.'
const vocabulary = [
  { term: 'Local async fixture', meaning: 'a supplied dependency that completes asynchronously with authored values or errors' },
  { term: 'AbortSignal', meaning: 'an object whose aborted flag tells participating work that cancellation was requested' },
  { term: 'Resource release', meaning: 'ending ownership after work settles, including failed or cancelled work' },
]

export const asyncRuntimeReps: Rep[] = [
  {
    id: 'await-local-records',
    title: 'Await local records in sequence',
    category: 'Practical concepts',
    runtime: 'async-fixture',
    context: 'Runtime behavior: load ordered records from an injected local fetcher, rather than calculating a recorded policy trace.',
    prompt:
      'Implement async loadRecords(ids, fixture). Fetch every ID once in input order, waiting for each fetch to settle before starting the next. Return the exact fetched strings in that order. On the first rejection, stop fetching and return null. Always release the fixture exactly once after all started work settles, including empty input and failure. The fixture catalog has a → " Ada ", b → "", and bad → rejection Error("Unavailable").',
    brief: {
      summary: 'Implement async loadRecords(ids, fixture).',
      rules: [
        'Fetch every ID once in input order, waiting for each fetch to settle before starting the next.',
        'Return the exact fetched strings in that order.',
        'On the first rejection, stop fetching and return null.',
        'Always release the fixture exactly once after all started work settles, including empty input and failure.',
        'The fixture catalog has a → " Ada ", b → "", and bad → rejection Error("Unavailable").',
      ],
    },
    example: { input: 'await loadRecords(["a", "b"], fixture)', output: '[" Ada ", ""]' },
    note,
    vocabulary,
    preserveInput: true,
    planPrompt: 'Describe what must finish before the next record starts, and what must happen when loading fails.',
    starter:
      fixtureTypes +
      `async function loadRecords(ids: string[], fixture: Fixture): Promise<string[] | null> {
  return []
}
`,
    functionName: 'loadRecords',
    hints: [
      'The next request depends on the previous one finishing. Keep an output array.',
      'Inside a loop, await each fetch before appending its value. A rejection interrupts that loop.',
      'Use try/catch for the null failure result and finally for release on every exit.',
    ],
    checks: [
      check(
        'Sequential values preserve whitespace and empty text',
        ['a', 'b'],
        [' Ada ', ''],
        ['start:a', 'resolve:a', 'start:b', 'resolve:b', 'release'],
      ),
      check('Empty input still releases', [], [], ['release']),
      check('Failure stops later work', ['a', 'bad', 'b'], null, ['start:a', 'resolve:a', 'start:bad', 'reject:bad', 'release']),
      check('First failure releases', ['bad', 'a'], null, ['start:bad', 'reject:bad', 'release']),
      check('Repeated IDs are separate operations', ['b', 'b'], ['', ''], ['start:b', 'resolve:b', 'start:b', 'resolve:b', 'release']),
      check('Twenty records stay sequential', Array(20).fill('a'), Array(20).fill(' Ada '), [
        ...Array.from({ length: 20 }, () => ['start:a', 'resolve:a']).flat(),
        'release',
      ]),
    ],
  },
  {
    id: 'settle-local-panels',
    title: 'Collect parallel panel outcomes',
    category: 'Practical concepts',
    runtime: 'async-fixture',
    context:
      'Runtime behavior: independent dashboard panels can succeed or fail separately. A failed panel must not discard successful ones.',
    prompt:
      'Implement async loadPanels(ids, fixture). Start one fetch per ID in input order before any fetch settles. Return one outcome per input position: {status: "ready", value: exact string} for fulfillment or {status: "error", message: exact Error.message} for rejection. Wait for every started fetch to settle, then release exactly once. Empty input returns []. Repeated IDs produce separate outcomes. The fixture catalog has a → " Ada ", b → "", and bad → rejection Error("Unavailable").',
    brief: {
      summary: 'Implement async loadPanels(ids, fixture).',
      rules: [
        'Start one fetch per ID in input order before any fetch settles.',
        'Return one outcome per input position: {status: "ready", value: exact string} for fulfillment or {status: "error", message: exact Error.message} for rejection.',
        'Wait for every started fetch to settle, then release exactly once.',
        'Empty input returns [].',
        'Repeated IDs produce separate outcomes.',
        'The fixture catalog has a → " Ada ", b → "", and bad → rejection Error("Unavailable").',
      ],
    },
    example: {
      input: 'await loadPanels(["a", "bad"], fixture)',
      output: '[{status: "ready", value: " Ada "}, {status: "error", message: "Unavailable"}]',
    },
    note,
    vocabulary,
    preserveInput: true,
    planPrompt: 'Restate the required start order, output order, and partial-failure behavior.',
    starter:
      fixtureTypes +
      `type Panel = {status: 'ready'; value: string} | {status: 'error'; message: string}
async function loadPanels(ids: string[], fixture: Fixture): Promise<Panel[]> {
  return []
}
`,
    functionName: 'loadPanels',
    hints: [
      'Starting work and collecting its outcomes are separate responsibilities.',
      'Create all promises first. A rejected panel must still contribute an outcome.',
      'Promise.allSettled preserves input order. Alternatively catch each promise into an outcome before Promise.all; release after the collection settles.',
    ],
    checks: [
      check(
        'Parallel success starts all work before settlement',
        ['a', 'b'],
        [
          { status: 'ready', value: ' Ada ' },
          { status: 'ready', value: '' },
        ],
        ['start:a', 'start:b', 'resolve:a', 'resolve:b', 'release'],
      ),
      check(
        'Partial failure retains successes',
        ['bad', 'a', 'b'],
        [
          { status: 'error', message: 'Unavailable' },
          { status: 'ready', value: ' Ada ' },
          { status: 'ready', value: '' },
        ],
        ['start:bad', 'start:a', 'start:b', 'reject:bad', 'resolve:a', 'resolve:b', 'release'],
      ),
      check('Empty panels release', [], [], ['release']),
      check(
        'All failures are represented separately',
        ['bad', 'bad'],
        [
          { status: 'error', message: 'Unavailable' },
          { status: 'error', message: 'Unavailable' },
        ],
        ['start:bad', 'start:bad', 'reject:bad', 'reject:bad', 'release'],
      ),
      check(
        'Repeated successes retain their positions',
        ['b', 'a', 'b'],
        [
          { status: 'ready', value: '' },
          { status: 'ready', value: ' Ada ' },
          { status: 'ready', value: '' },
        ],
        ['start:b', 'start:a', 'start:b', 'resolve:b', 'resolve:a', 'resolve:b', 'release'],
      ),
      check(
        'Twenty panels start together',
        Array(20).fill('b'),
        Array.from({ length: 20 }, () => ({ status: 'ready', value: '' })),
        [...Array(20).fill('start:b'), ...Array(20).fill('resolve:b'), 'release'],
      ),
    ],
  },
  {
    id: 'cancel-local-export',
    title: 'Recall cancellation in a local export',
    category: 'Practical concepts',
    runtime: 'async-fixture',
    context: 'Runtime behavior: an export owns a resource until its work ends, even when cancellation arrives during a fetch.',
    prompt:
      'Implement async exportRecords(ids, fixture). Fetch records sequentially in input order, passing fixture.signal to every fetch. Return {status: "done", text: values joined with "|"} after success. If the signal is already aborted, start no fetch and return {status: "cancelled"}. If a fetch rejects with name "AbortError", stop and return {status: "cancelled"}; any other rejection returns {status: "error", message: Error.message}. Never start later records after rejection. Release exactly once after all started work settles on every exit. The catalog is a → " Ada ", b → "", bad → Error("Unavailable"). During-cancellation fixtures abort inside the first fetch before settlement; signal-aware fetch rejects with AbortError.',
    brief: {
      summary: 'Implement async exportRecords(ids, fixture).',
      rules: [
        'Fetch records sequentially in input order, passing fixture.signal to every fetch.',
        'Return {status: "done", text: values joined with "|"} after success.',
        'If the signal is already aborted, start no fetch and return {status: "cancelled"}.',
        'If a fetch rejects with name "AbortError", stop and return {status: "cancelled"}; any other rejection returns {status: "error", message: Error.message}.',
        'Never start later records after rejection.',
        'Release exactly once after all started work settles on every exit.',
        'The catalog is a → " Ada ", b → "", bad → Error("Unavailable").',
        'During-cancellation fixtures abort inside the first fetch before settlement; signal-aware fetch rejects with AbortError.',
      ],
    },
    example: { input: 'await exportRecords(["a", "b"], fixture) // signal not aborted', output: '{status: "done", text: " Ada |"}' },
    note:
      note +
      ' Cancellation is cooperative: passing the signal matters. Empty input succeeds with empty text unless already aborted, when cancellation takes precedence. The supplied signal is read-only; do not replace it or call release before work settles.',
    vocabulary,
    preserveInput: true,
    planPrompt: 'Name the output for success, cancellation, and failure, and describe when resource ownership ends.',
    starter:
      fixtureTypes +
      `type ExportResult = {status: 'done'; text: string} | {status: 'cancelled'} | {status: 'error'; message: string}
async function exportRecords(ids: string[], fixture: Fixture): Promise<ExportResult> {
  return {status: 'done', text: ''}
}
`,
    functionName: 'exportRecords',
    hints: [
      'Treat cancellation as a distinct outcome from ordinary failure.',
      'Check cancellation before starting, and let the supplied fetch participate through its signal argument.',
      'Inspect the caught error name. A finally block can release exactly once after the awaited operation settles.',
    ],
    checks: [
      check('Success joins exact strings', ['a', 'b'], { status: 'done', text: ' Ada |' }, [
        'start:a',
        'resolve:a',
        'start:b',
        'resolve:b',
        'release',
      ]),
      check('Already cancelled starts no work', ['a'], { status: 'cancelled' }, ['release'], 'before'),
      check(
        'Cancellation during fetch stops later records',
        ['a', 'b'],
        { status: 'cancelled' },
        ['start:a', 'abort:a', 'release'],
        'during',
      ),
      check('Ordinary failure is not cancellation', ['bad', 'a'], { status: 'error', message: 'Unavailable' }, [
        'start:bad',
        'reject:bad',
        'release',
      ]),
      check('Empty export succeeds and releases', [], { status: 'done', text: '' }, ['release']),
      check('Already cancelled empty export is cancelled', [], { status: 'cancelled' }, ['release'], 'before'),
      check('Repeated values stay separate', ['b', 'b'], { status: 'done', text: '|' }, [
        'start:b',
        'resolve:b',
        'start:b',
        'resolve:b',
        'release',
      ]),
      check('Twenty records release only after the last', Array(20).fill('b'), { status: 'done', text: Array(20).fill('').join('|') }, [
        ...Array.from({ length: 20 }, () => ['start:b', 'resolve:b']).flat(),
        'release',
      ]),
    ],
  },
]
