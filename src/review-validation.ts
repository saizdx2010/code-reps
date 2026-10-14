import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const validationGuides: Record<string, ReflectionGuide> = {
  'validate-stock-adjustment': {
    plan: [
      'Separate shape, type, normalization, and allowed values.',
      'Reject zero, fractions, and out-of-range changes.',
      'Create a result without changing input.',
    ],
    explanation: [
      'Trace a normalized SKU and both numerical limits.',
      'Explain rejection versus coercion and clamping.',
      'Account for string-processing costs.',
    ],
    example:
      'I validate the object and field types, normalize the SKU, and test the allowed character set and length. I accept a nonzero integer within both limits and return a fresh object. Trimming and uppercase conversion scale with text length; behavioral checks do not prove which approach I used.',
  },
  'parse-delivery-window': {
    plan: [
      'Follow the specified error precedence.',
      'Validate address only when delivery requires it.',
      'Default absent minutes while preserving zero.',
    ],
    explanation: [
      'Trace a request with multiple invalid fields.',
      'Explain why pickup ignores address and null minutes is rejected.',
      'Distinguish parsed-object checks from real scheduling behavior.',
    ],
    example:
      'I reject invalid shape, then mode, then a required delivery address, then minutes. Pickup always returns null address. Undefined minutes defaults to 20, but zero remains zero and null is invalid. Address trimming scales with its length. Passing these checks establishes this boundary policy, not a running delivery service.',
  },
  'validate-import-batch': {
    plan: [
      'Reject invalid batch shape and size first.',
      'Validate each row before checking its normalized ID for duplication.',
      'Return no partial success after the first error.',
    ],
    explanation: [
      'Trace two differently written IDs that normalize equally.',
      'Explain why invalid amount wins over duplicate ID in the same row.',
      'Separate validation output from an actual atomic storage operation.',
    ],
    example:
      'I validate the array, then visit rows in order with a set of accepted IDs and a fresh output array. I validate every field before testing uniqueness. The first error returns only its index and error. Work scales with rows and ID text; output and the set scale with accepted rows. This does not perform or test a database transaction.',
  },
}

export const validationDepth: Record<string, RepDepth> = {
  'validate-stock-adjustment': {
    reasoning:
      'A success object is created only after shape, type, normalized text, and numeric rules hold. Normalization never repairs an invalid number.',
    trace:
      'For {sku: " ab-2 ", change: -50}, trim gives ab-2, uppercase gives AB-2, and -50 is an allowed boundary. With change 0, return null even though the SKU is valid.',
    alternative:
      'Explicit guards keep the small contract visible; a reusable schema may help many endpoints. Both must encode this exact character set and nonzero inclusive range. String processing depends on SKU length.',
    counterexample:
      'Number(change) accepts "2", which is forbidden. Checking raw length rejects a valid padded 12-character SKU; trimming the input property changes caller data.',
    transfer:
      'Allow a zero adjustment only when reason is exactly "audit". Define shape and precedence before changing the validator. This new contract is self-reviewed, not checked by the original cases.',
  },
  'parse-delivery-window': {
    reasoning:
      'Ordered guards ensure conflicting errors always produce the documented response. The address rule belongs only to delivery; the minutes default belongs only to absence.',
    trace:
      'For delivery with blank address and minutes -1, INVALID_ADDRESS wins. For pickup with address 42 and minutes 0, address is ignored and the success returns null address and zero minutes.',
    alternative:
      'A collected list of errors could be useful for a form, but returning all errors would change this contract. Early returns make its priority visible. Only delivery address processing grows with text length.',
    counterexample:
      'minutes || 20 replaces valid zero. minutes ?? 20 accepts null, although this contract rejects it. Requiring address for pickup wrongly rejects the example.',
    transfer:
      'Add a scheduled mode requiring a date and decide where date errors fit in the precedence. Write conflicting examples first; the original checks do not assess this variation.',
  },
  'validate-import-batch': {
    traceSteps: {
      code: [
        'type ImportResult = {ok: true; rows: {id: string; amount: number}[]} | {ok: false; index: number; error: string}',
        'function importBatch(input: unknown): ImportResult {',
        "  if (!Array.isArray(input) || input.length < 1 || input.length > 50) return {ok: false, index: -1, error: 'INVALID_BATCH'}",
        '  const seen = new Set<string>(), rows: {id: string; amount: number}[] = []',
        '  for (const [index, row] of input.entries()) {',
        "    if (typeof row !== 'object' || row === null || Array.isArray(row)) return {ok: false, index, error: 'INVALID_ROW'}",
        '    const {id, amount} = row as {id?: unknown; amount?: unknown}',
        "    if (typeof id !== 'string' || typeof amount !== 'number' || !Number.isInteger(amount)) return {ok: false, index, error: 'INVALID_ROW'}",
        '    const key = id.trim().toLowerCase()',
        "    if (!/^[a-z0-9]{1,10}$/.test(key) || amount < 0 || amount > 9999) return {ok: false, index, error: 'INVALID_ROW'}",
        "    if (seen.has(key)) return {ok: false, index, error: 'DUPLICATE_ID'}",
        '    seen.add(key); rows.push({id: key, amount})',
        '  }',
        '  return {ok: true, rows}',
        '}',
      ],
      input: 'input = [{id: " A1 ", amount: 0}, {id: "B2", amount: 5}, {id: "a1", amount: -1}, {id: "a1", amount: 2}]',
      steps: [
        {
          line: 2,
          vars: { length: 4 },
          structure: { kind: 'array', values: ['" A1 ": 0', '"B2": 5', '"a1": -1', '"a1": 2'] },
          note: 'The batch is an array of 4 rows, inside 1–50, so rule 1 passes. Rows are examined in order next.',
        },
        {
          line: 8,
          vars: { index: 0, key: 'a1', amount: 0 },
          structure: { kind: 'array', values: ['" A1 ": 0', '"B2": 5', '"a1": -1', '"a1": 2'], pointers: { index: 0 } },
          note: 'Row 0 has the right shape. Its id normalizes to a1. Amount 0 is a valid integer, not a missing value.',
        },
        {
          line: 11,
          vars: { index: 0, seen: '{a1}', rows: 1 },
          structure: { kind: 'array', values: ['" A1 ": 0', '"B2": 5', '"a1": -1', '"a1": 2'], pointers: { index: 0 } },
          note: 'a1 passes rules 2–4 and is new, so it is accepted. Only the normalized id and amount are kept.',
        },
        {
          line: 11,
          vars: { index: 1, seen: '{a1, b2}', rows: 2 },
          structure: { kind: 'array', values: ['" A1 ": 0', '"B2": 5', '"a1": -1', '"a1": 2'], pointers: { index: 1 }, dimmed: [0] },
          note: 'B2 lowercases to b2 before the character check, so it is accepted too.',
        },
        {
          line: 8,
          vars: { index: 2, key: 'a1', amount: -1 },
          structure: { kind: 'array', values: ['" A1 ": 0', '"B2": 5', '"a1": -1', '"a1": 2'], pointers: { index: 2 }, dimmed: [0, 1] },
          note: 'Row 2 repeats a1, but rule 5 waits until the row passes rules 2–4.',
        },
        {
          line: 9,
          vars: { result: '{"ok":false,"index":2,"error":"INVALID_ROW"}' },
          structure: { kind: 'array', values: ['" A1 ": 0', '"B2": 5', '"a1": -1', '"a1": 2'], pointers: { index: 2 }, dimmed: [0, 1, 3] },
          note: 'Amount -1 fails rule 4, so INVALID_ROW wins over the duplicate. The accepted rows are discarded and row 3 is never examined.',
        },
      ],
    },
    reasoning:
      'Before each row, accepted output contains only valid rows with distinct normalized IDs. Validating before duplicate detection and stopping immediately preserves the earliest-error rule.',
    trace:
      'Row 0 {id: " A1 ", amount: 0} becomes a1. Row 1 {id: "a1", amount: -1} gives INVALID_ROW at index 1; changing its amount to 2 gives DUPLICATE_ID instead. Neither response includes partial rows.',
    alternative:
      'Comparing each normalized ID against every earlier row avoids a set but can require quadratic comparisons. A set uses storage proportional to accepted rows and expected constant-time lookup. Include ID normalization work in the time estimate.',
    counterexample:
      'Checking duplicates on raw IDs misses " A1 " versus "a1". Returning rows collected before an error violates all-or-nothing output. Checking uniqueness before amount chooses the wrong error.',
    transfer:
      'Design a preview that reports every invalid row while still prohibiting writes until the batch is valid. Decide how repeated invalid IDs should be reported. This is a separately self-reviewed contract.',
  },
}
