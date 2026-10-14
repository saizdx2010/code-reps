import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

// Rich exercises and multi-file capstone projects.
export const richDepth: Record<string, RepDepth> = {
  'debug-cart-total': {
    reasoning: 'Repair each independent rule and keep the discount outside the per-item subtotal.',
    trace: 'An available item at 100 cents with quantity 2 and discount 30 gives 200 minus 30 = 170; an unavailable item contributes zero.',
    alternative:
      'A loop or reduce can calculate the subtotal. Integer cents avoid common fractional-currency representation issues but still need a supported numeric range.',
    counterexample:
      'Subtracting 30 per item applies a global discount repeatedly. A quantity-one example cannot expose the missing multiplication.',
    transfer: 'Write separate regression cases for quantity, availability, repeated discount, and zero clamping.',
  },
  'frontend-directory': {
    reasoning: 'Explicit state branches and safe DOM construction protect observable behavior.',
    trace:
      'Loading plus an error shows only Loading…. In loaded data, typing spaces around ADA matches original Ada text; clearing the query restores all people.',
    alternative:
      'Rebuilding the list is simple for a small directory; updating only changed nodes can preserve interaction state but adds bookkeeping.',
    counterexample:
      'innerHTML interprets a name containing markup. textContent preserves it as visible text. Binding Retry twice calls the callback twice.',
    transfer:
      'Review keyboard navigation and retry behavior, then describe how you would prevent an obsolete request from replacing newer results.',
  },
  'read-batch-labels': {
    traceSteps: {
      code: [
        'function collectLabels(input: string[]): string[] {',
        '  const seen = new Set<string>()',
        '  const output: string[] = []',
        '  for (const raw of input) {',
        '    const label = raw.trim()',
        '    if (label !== "" && !seen.has(label)) {',
        '      seen.add(label)',
        '      output.push(label)',
        '    }',
        '  }',
        '  return output',
        '}',
        'const cases = { repeat: [" Ada ", "Bo", "Ada"], empty: [], blank: [" ", "", "Bo"], case: ["Ada", "ada", "Ada"] }',
        'const predictLabels = (caseName: keyof typeof cases) => collectLabels(cases[caseName])',
      ],
      input: 'caseName = "repeat"',
      steps: [
        {
          line: 2,
          vars: { caseName: 'repeat' },
          structure: {
            kind: 'state',
            entries: [
              ['label', null],
              ['seen', '{}'],
              ['output', '[]'],
            ],
            events: ['" Ada "', '"Bo"', '"Ada"'],
          },
          note: 'This replays collectLabels on the repeat case. Your answer should be the prediction you made before running anything.',
        },
        {
          line: 4,
          vars: { raw: ' Ada ', label: 'Ada' },
          structure: {
            kind: 'state',
            entries: [
              ['label', 'Ada'],
              ['seen', '{}'],
              ['output', '[]'],
            ],
            events: ['" Ada "', '"Bo"', '"Ada"'],
            eventIndex: 0,
          },
          note: 'trim runs before any comparison, so the spaced value becomes Ada.',
        },
        {
          line: 7,
          vars: { raw: ' Ada ', label: 'Ada' },
          structure: {
            kind: 'state',
            entries: [
              ['label', 'Ada'],
              ['seen', '{Ada}'],
              ['output', '["Ada"]'],
            ],
            events: ['" Ada "', '"Bo"', '"Ada"'],
            eventIndex: 0,
          },
          note: 'Ada is not blank and has not been seen, so it is recorded and added to the output.',
        },
        {
          line: 7,
          vars: { raw: 'Bo', label: 'Bo' },
          structure: {
            kind: 'state',
            entries: [
              ['label', 'Bo'],
              ['seen', '{Ada, Bo}'],
              ['output', '["Ada","Bo"]'],
            ],
            events: ['" Ada "', '"Bo"', '"Ada"'],
            eventIndex: 1,
          },
          note: 'Bo has no spaces to trim and is new, so it follows Ada in first-seen order.',
        },
        {
          line: 5,
          vars: { raw: 'Ada', label: 'Ada' },
          structure: {
            kind: 'state',
            entries: [
              ['label', 'Ada'],
              ['seen', '{Ada, Bo}'],
              ['output', '["Ada","Bo"]'],
            ],
            events: ['" Ada "', '"Bo"', '"Ada"'],
            eventIndex: 2,
          },
          note: 'The trimmed Ada is already in seen, so the condition is false and nothing changes. Lowercase ada would not match.',
        },
        {
          line: 10,
          vars: { result: '["Ada","Bo"]' },
          structure: {
            kind: 'state',
            entries: [
              ['label', 'Ada'],
              ['seen', '{Ada, Bo}'],
              ['output', '["Ada","Bo"]'],
            ],
            events: ['" Ada "', '"Bo"', '"Ada"'],
            eventIndex: 2,
          },
          note: 'Return the output. The blank case follows the same path, but trim turns " " and "" into empty labels, which are skipped.',
        },
      ],
    },
    reasoning: 'Predicting intermediate state separates understanding from merely executing supplied code.',
    trace:
      'For [ Ada with spaces,Bo,Ada], trim to Ada, save it, save Bo, then skip the repeated Ada. Case variants Ada and ada remain distinct.',
    alternative:
      'Writing predicted arrays makes reasoning explicit; calling collectLabels returns results without demonstrating a prediction.',
    counterexample: 'Assuming lowercase normalization merges Ada and ada, which this collector does not do.',
    transfer: 'Predict a new sequence containing blanks, spaced duplicates, and case variants before running it.',
  },
  'backend-ticket-handler': {
    reasoning: 'Validation precedence and filter-before-page order are part of the response contract.',
    trace:
      'An unsupported method returns 405 even with a bad query. For three matching tickets, page 2 size 2 returns the third with total 3.',
    alternative:
      'Filtering then slicing is clear in memory; a database query must use equivalent predicates and deterministic order for both count and page.',
    counterexample: 'Paging first can omit matches on later positions and makes total describe the wrong collection.',
    transfer: 'Describe how to keep count and page consistent if data changes between two database queries.',
  },
  'refactor-stock-summary': {
    reasoning: 'Behavioral equivalence includes order, duplicates, and zero-unit records, not just totals.',
    trace:
      'An available ID a with zero units still adds a to ids; another available a contributes its units and value and remains a second ID.',
    alternative:
      'One pass reduces repeated traversal; several named passes can be easier to review. Both are linear, so clarity is a separate judgment.',
    counterexample: 'Deduplicating IDs or dropping zero-unit records makes the refactor change behavior.',
    transfer: 'Compare two designs using the same cases, then identify a readability improvement tests cannot establish.',
  },
  'project-team-directory': {
    reasoning: 'Module boundaries should make data selection testable separately from DOM construction.',
    trace:
      'Follow query input into the selection module, receive original matching labels, then render them as text. Loading bypasses controls; Retry calls the supplied callback.',
    alternative:
      'One file is easy initially; separate data and rendering modules help focused changes. Integration checks alone do not prove the separation is meaningful.',
    counterexample: 'Duplicating normalization in both modules can produce different matches in tests and rendering.',
    transfer: 'Add a team filter in the data module and trace the smallest rendering changes needed. Review focus manually.',
  },
  'project-ticket-api': {
    reasoning: 'Trusted query parsing should be shared by counting and page selection.',
    trace:
      'Reject a non-GET method first; pass a valid query through normalization, filter tickets once, count matches, and return the requested slice.',
    alternative:
      'A query module centralizes defaults and validation. Keeping parsing in the handler is simpler initially but easier to duplicate across endpoints.',
    counterexample: 'Using separate search rules for count and page makes total inconsistent with returned items.',
    transfer: 'Add a second endpoint using the same query contract and identify what should remain handler-specific.',
  },
}

export const richGuides: Record<string, ReflectionGuide> = {
  'project-team-directory': {
    plan: ['Separate selection from rendering.', 'Keep all request states explicit.', 'Use safe text and keyboard-operable controls.'],
    explanation: [
      'Trace an interaction across modules.',
      'Review accessibility manually.',
      'Explain why integration checks alone do not prove module design.',
    ],
    example:
      'I keep filtering in the data module and DOM work in the rendering module. The input listener obtains a fresh selection and renders original labels as text. I test all states and separately review focus and layout.',
  },
  'project-ticket-api': {
    plan: [
      'Validate the method before the query.',
      'Normalize trusted fields in the query module.',
      'Filter before calculating total and page.',
    ],
    explanation: [
      'Trace invalid and valid requests across modules.',
      'Explain response shapes and unchanged input.',
      'Discuss where database integration would belong.',
    ],
    example:
      'I reject unsupported methods first, ask the query module for trusted values, then filter and slice tickets in the handler. Integration checks verify responses; I review module responsibilities separately.',
  },
  'debug-cart-total': {
    plan: [
      'Trace quantities, sold-out items, and repeated discount application in the draft.',
      'Repair the subtotal rules before applying the discount.',
      'Preserve the input objects.',
    ],
    explanation: [
      'Explain each bug and the regression case that exposes it.',
      'Distinguish integer cents from floating-point currency values.',
    ],
    example:
      'I count only available items at priceCents times quantity, subtract the discount once, then clamp to zero. This fixes the quantity, sold-out, and repeated-discount bugs. One pass uses O(n) time and O(1) extra space.',
  },
  'frontend-directory': {
    plan: [
      'Choose loading before error before loaded content.',
      'Build labeled controls and a list using safe text insertion.',
      'Update the filtered list on input without mutating people.',
    ],
    explanation: [
      'Explain state precedence, query normalization, and original-label preservation.',
      'Review keyboard focus and all four states in the preview yourself.',
      'Passing interaction checks does not establish visual or accessibility quality.',
    ],
    example:
      'I render loading or error first, wiring Retry to the supplied callback. For loaded data I create a labeled input and rerender the list on input events, using textContent for names. Filtering visits the people and processes their name text; rendering work scales with the visible output. I separately review keyboard access and layout.',
  },
  'read-batch-labels': {
    plan: [
      'Write predictions before running checks.',
      'Trace raw, trimmed label, seen, and output for every iteration.',
      'Compare blank input and case-sensitive names.',
    ],
    explanation: [
      'Explain how trimming happens before duplicate detection.',
      'Explain why first-seen order is preserved and case variants remain distinct.',
      'Review whether your trace predicted the result without calling the supplied collector.',
    ],
    example:
      'For repeat, the first raw label becomes Ada, Bo is then added, and the final Ada is already seen. Empty produces no output; blank keeps only Bo; case keeps Ada and ada separately. I wrote the predictions before checking them. The collector scans input and stores accepted labels, with additional work for trimming each string.',
  },
  'backend-ticket-handler': {
    plan: [
      'Validate method before query shape and optional fields.',
      'Filter by status and normalized search before counting.',
      'Page the filtered list and preserve source objects.',
    ],
    explanation: [
      'Explain the 405 and 400 responses and the defaults.',
      'Explain why total is measured before pagination.',
      'State that these are parsed request objects, not live HTTP or URL-parser checks.',
    ],
    example:
      'I reject unsupported methods, validate optional query fields without coercion, then filter in input order. I calculate total before slicing the requested page. Invalid queries always return the same 400 error contract. Filtering takes a pass plus title-search work; output and the filtered array use extra space proportional to their sizes.',
  },
  'refactor-stock-summary': {
    plan: [
      'Run the existing behavior checks before changing the working code.',
      'Replace unclear names and duplicated conditions.',
      'Preserve zero-unit IDs, duplicates, order, and source data.',
    ],
    explanation: [
      'Compare the original three scans with your revised structure.',
      'Explain why the new names clarify the response fields.',
      'Review structure yourself: passing checks alone does not prove the code improved.',
    ],
    example:
      'I use descriptive ids, units, and valueCents accumulators and update all three during one pass over available products. Zero units still keep an ID, and duplicates stay duplicated. Both versions are O(n) time; one pass reduces repeated logic. The IDs array uses O(n) output space. I assess readability separately from passing checks.',
  },
}
