import type { RepDepth } from './rep-depth.ts'
import type { LessonDepth } from './lesson-depth.ts'

export const typescriptDepth: Record<string, RepDepth> = {
  'guard-contact-input': {
    'reasoning': 'Shape validation makes field access safe; name validation then establishes the narrower application policy.',
    'trace': 'For {name: " Ada ", subscribed: false}, the guard passes, trim produces Ada, and false is copied unchanged. Null fails before property access.',
    'alternative': 'A parser returning a result union can explain rejection reasons; a boolean guard is simpler but loses that detail. Work is proportional to name length.',
    'counterexample': 'Boolean("false") produces true and incorrectly accepts a string; an assertion validates nothing.',
    'transfer': 'Self-review: allow optional email. Specify missing versus blank and revise the guard and policy; original checks do not cover this change.'
  },
  'exhaustive-delivery-label': {
    'reasoning': 'A literal discriminator selects one payload; returns eliminate all variants before the never assignment.',
    'trace': 'Sent with an empty receipt still returns Sent: followed by a space. Rejected reads reason, never receipt.',
    'alternative': 'An if chain can be exhaustive too, but a permissive fallback hides future variants. Both use constant work plus output text.',
    'counterexample': 'A default returning Queued passes current valid inputs yet masks a newly added cancelled variant. Output checks cannot catch that type-design defect.',
    'transfer': 'Self-review: add cancelled with a timestamp and verify strict compiler failure until its switch case is implemented.'
  },
  'generic-prefix-copy': {
    'reasoning': 'The helper only chooses positions, so it can preserve the caller’s element type without knowing its structure.',
    'trace': 'For [false, null, 0] and count 3 every value survives; for count 0 the new array is empty.',
    'alternative': 'A manual loop makes copying explicit but must preserve the same type parameter. slice takes O(min(count,n)) output space and work.',
    'counterexample': 'Filtering by truthiness loses false, null, and zero. Returning items directly fails fresh-array self-review even when values match.',
    'transfer': 'Self-review: build a generic last-item helper returning T | undefined and explain the empty case.'
  },
  'typed-record-lookup': {
    'reasoning': 'The constraint permits reading id while T retains other fields. A tagged result distinguishes absence from a valid falsy payload.',
    'trace': 'With two x records, the first is returned intact. An empty requested ID can match; missing retains the original requested ID.',
    'alternative': 'An index helps repeated queries but must define duplicate precedence and costs extra storage. A one-off scan is O(n) time and constant working space.',
    'counterexample': 'A Map built by overwriting chooses the last duplicate. Returning only {id} erases the caller’s payload and breaks the generic relationship.',
    'transfer': 'Self-review: add an ambiguous result for duplicate IDs and update an exhaustive consumer. Original checks still require first-match behavior.'
  },
  'sensor-import-report': {
    'reasoning': 'Validation separates uncertain entries from trusted readings. Each accepted group is the sum of valid readings in the visited prefix; rejected indices refer to the original batch.',
    'trace': 'Readings a:2, b:0, a:-2, null produce a:0 then b:0 and rejected [3]. A zero total is still a group.',
    'alternative': 'A Map preserves insertion order and handles special keys. An array search is simpler for tiny batches but can take quadratic time; expected Map work is linear with O(n) output/storage.',
    'counterexample': 'A plain object can mishandle __proto__. Coercing "2" accepts invalid input; dropping zero sums removes valid groups.',
    'transfer': 'Self-review: add units and disallow mixing units per channel. Specify whether a conflict rejects one entry or the whole batch.'
  }
}

export const typescriptGuides = {
  'guard-contact-input': {
    'plan': [
      'Which shape checks must happen before reading fields? Trace null, an array, and subscribed false.'
    ],
    'explanation': [
      'Explain the boundary case and the preserved type relationship.',
      'Review type requirements separately from runtime output, without any or unsafe assertions.'
    ],
    'example': 'Shape validation makes field access safe; name validation then establishes the narrower application policy. For {name: " Ada ", subscribed: false}, the guard passes, trim produces Ada, and false is copied unchanged. Null fails before property access. Runtime success is behavioral evidence; semantic types still need a strict compiler check.'
  },
  'exhaustive-delivery-label': {
    'plan': [
      'List variant-specific fields and explain what should happen to compiler feedback when a fourth variant is added.'
    ],
    'explanation': [
      'Explain the boundary case and the preserved type relationship.',
      'Review type requirements separately from runtime output, without any or unsafe assertions.'
    ],
    'example': 'A literal discriminator selects one payload; returns eliminate all variants before the never assignment. Sent with an empty receipt still returns Sent: followed by a space. Rejected reads reason, never receipt. Runtime success is behavioral evidence; semantic types still need a strict compiler check.'
  },
  'generic-prefix-copy': {
    'plan': [
      'Predict count zero, count beyond length, and a collection containing false and null. What type should the caller receive?'
    ],
    'explanation': [
      'Explain the boundary case and the preserved type relationship.',
      'Review type requirements separately from runtime output, without any or unsafe assertions.'
    ],
    'example': 'The helper only chooses positions, so it can preserve the caller’s element type without knowing its structure. For [false, null, 0] and count 3 every value survives; for count 0 the new array is empty. Runtime success is behavioral evidence; semantic types still need a strict compiler check.'
  },
  'typed-record-lookup': {
    'plan': [
      'Predict duplicate IDs, an empty ID, and a missing record. Explain what callers know after inspecting the result.'
    ],
    'explanation': [
      'Explain the boundary case and the preserved type relationship.',
      'Review type requirements separately from runtime output, without any or unsafe assertions.'
    ],
    'example': 'The constraint permits reading id while T retains other fields. A tagged result distinguishes absence from a valid falsy payload. With two x records, the first is returned intact. An empty requested ID can match; missing retains the original requested ID. Runtime success is behavioral evidence; semantic types still need a strict compiler check.'
  },
  'sensor-import-report': {
    'plan': [
      'Predict a batch with repeated channels, a zero total, and invalid entries. State the output order and rejection indices.'
    ],
    'explanation': [
      'Explain the boundary case and the preserved type relationship.',
      'Review type requirements separately from runtime output, without any or unsafe assertions.'
    ],
    'example': 'Validation separates uncertain entries from trusted readings. Each accepted group is the sum of valid readings in the visited prefix; rejected indices refer to the original batch. Readings a:2, b:0, a:-2, null produce a:0 then b:0 and rejected [3]. A zero total is still a group. Runtime success is behavioral evidence; semantic types still need a strict compiler check.'
  }
}

export const typescriptLessonDepth: LessonDepth = {
  'title': 'A future variant should break the compiler',
  'code': 'type Result<T> = {kind: \'ok\'; value: T} | {kind: \'error\'; message: string}\nfunction unwrap<T>(r: Result<T>): T | null {\n  switch (r.kind) {\n    case \'ok\': return r.value\n    case \'error\': return null\n    default: { const impossible: never = r; return impossible }\n  }\n}',
  'reasoning': 'The tag narrows payload access, and handling every tag leaves never. T links the ok payload to the return type. None of these declarations validates unknown input.',
  'challenge': 'Add {kind: pending} to Result. Which line should fail in strict tsc? Could current runtime tests still pass? What happens for ok with value false?',
  'answer': 'The never assignment fails because pending remains. Existing tests exercising only ok and error can still pass after transpilation. ok false returns false, not null. Add a pending branch and new behavior tests; validate unknown data separately.'
}
