import type { Skill } from './knowledge.ts'

export const typescriptBoundarySkill: Skill = {
  id: 'typescript-boundaries',
  title: 'Narrowing, unions, and generics',
  summary: 'Guard unknown data, exhaust unions, and keep generic types, separating compiler promises from runtime evidence.',
  prerequisites: ['values', 'state-modeling', 'validation'],
  objectives: [
    'Justify a type predicate with runtime checks.',
    'Use never to expose an unhandled union variant.',
    'Preserve a caller’s payload type through a reusable API.',
    'Separate semantic type analysis from behavioral checks.',
  ],
  sections: [
    {
      title: 'Unknown is an honest boundary',
      body: 'A parsed JSON value can be null, an array, or an object with the wrong fields. Treat it as unknown: check for a non-null, non-array object, then each field. A predicate returning value is Contact must really inspect every required field; a lying predicate compiles yet fails at runtime, and an assertion validates nothing. A string field proves shape, not a sensible name, so apply length rules separately. False is a valid boolean; truthiness is not a type check.',
    },
    {
      title: 'Narrow alternatives, then exhaust them',
      body: 'A literal tag connects a variant to its payload, and a switch narrows each case. Return from every case; in default, assign the remaining value to never. A strict semantic compiler then reports any variant you forgot. This protects future edits; it does not inspect unknown runtime input.',
    },
    {
      title: 'Generics connect inputs to outputs',
      body: 'takePrefix<T>(items: readonly T[], count: number): T[] preserves the element type. T extends {id: string} permits reading id while keeping the caller’s other fields. A Lookup<T> union exposes found with value: T or missing with id; consumers narrow the tag first. Returning any discards the relationship.',
    },
    {
      title: 'Two kinds of evidence',
      body: 'Code Reps transpiles learner TypeScript and runs behavioral cases; it does not perform semantic type checking, so never and generic requirements are self-reviewed. Copy your code into a local project and run tsc --noEmit with strict enabled, including deliberately invalid callers that should produce diagnostics. Runtime tests still need empty, falsy, malformed, duplicate, and boundary cases. Neither compiling nor passing examples proves understanding.',
    },
  ],
  example:
    "type Lookup<T> = {kind: 'found'; value: T} | {kind: 'missing'; id: string}\nfunction lookup<T extends {id: string}>(records: readonly T[], id: string): Lookup<T> {\n  const value = records.find(record => record.id === id)\n  return value === undefined ? {kind: 'missing', id} : {kind: 'found', value}\n}\nconst result = lookup([{id: 'a', score: 0}], 'a')\nif (result.kind === 'found') console.log(result.value.score)",
  walkthrough: [
    'T is inferred as a record containing id and score.',
    'The exact ID comparison finds the record even when score is zero.',
    'The found tag permits reading value.score; missing does not have value.',
    'A caller reading result.value before narrowing should fail strict semantic checking. The practice worker does not establish that diagnostic.',
  ],
  mistakes: [
    'Trusting parsed JSON with as.',
    'Declaring a predicate without checking all required fields.',
    'Using a fallback that silently accepts future variants.',
    'Replacing a generic relationship with any.',
    'Treating runtime output success as compiler evidence.',
  ],
  questions: [
    {
      id: 'ts-boundary-predicate-v1',
      prompt: 'Which statement about a user-defined type guard is true?',
      code: 'function isName(v: unknown): v is string { return true }',
      options: [
        'The compiler proves the predicate body validates strings',
        'The predicate can lie; its runtime checks must justify its claim',
        'The predicate converts v into a string',
      ],
      answer: 1,
      explanation: 'The signature influences narrowing, but returning true for every input is not validation.',
    },
    {
      id: 'ts-boundary-never-v1',
      prompt: 'A new union variant is added without a switch case. What checks the remaining value assigned to never?',
      code: 'const unhandled: never = result',
      options: ['Strict semantic compiler analysis', 'Output checks of only the old variants', 'JSON parsing'],
      answer: 0,
      explanation:
        'Semantic analysis rejects the remaining variant as not assignable to never. Transpilation and old behavior cases can still succeed.',
    },
  ],
  repIds: ['guard-contact-input', 'exhaustive-delivery-label', 'generic-prefix-copy', 'typed-record-lookup', 'sensor-import-report'],
  related: ['state-modeling', 'validation', 'values'],
}
