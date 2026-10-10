import type { Rep } from './rep.ts'

export const validationReps: Rep[] = [
  {
    id: 'validate-stock-adjustment', title: 'Validate a stock adjustment', category: 'Backend core', format: 'backend',
    context: 'An inventory screen submits unknown data. Accept only adjustments that match the written boundary contract.',
    prompt: 'Implement stockAdjustment(input). Accept a non-null object that is not an array, with a string sku and an integer change from -50 through 50 excluding zero. Trim sku and convert it to uppercase. The normalized SKU must contain 1–12 characters, each an ASCII letter A–Z, digit 0–9, or hyphen. Return {sku, change} for valid input, otherwise null.',
    example: { input: 'stockAdjustment({sku: " ab-2 ", change: -3})', output: '{sku: "AB-2", change: -3}' },
    note: 'Do not coerce values. Extra properties are ignored and excluded from the result. Length is checked after JavaScript trim and uppercase conversion; surrounding whitespace is allowed, internal spaces are not. A hyphen by itself is valid. Do not change the input. Authored requests have at most 20 properties and strings at most 200 characters.',
    vocabulary: [{ term: 'Normalization', meaning: 'converting accepted text to the format required by a contract' }, { term: 'ASCII', meaning: 'a character set that includes the English alphabet, digits, and common punctuation' }],
    planPrompt: 'Restate the accepted input and output. Name an invalid value and a value exactly at a limit before coding.',
    starter: `function stockAdjustment(input: unknown): {sku: string; change: number} | null {
  // Implement the written contract.
  return null
}
`,
    functionName: 'stockAdjustment', preserveInput: true,
    hints: ['Separate request shape, field types, and allowed values. Reject invalid input rather than repairing numbers.', 'Exclude null and arrays before reading fields. Normalize string text before checking its permitted characters and length.', 'Check that change is a whole number, not zero, and inside the inclusive range. Then check the normalized SKU: its length and every character must be allowed. Build the result object only after every rule passes.'],
    checks: [
      { name: 'Normalizes the example and ignores extra fields', input: [{sku: ' ab-2 ', change: -3, comment: 'counted'}], expected: {sku: 'AB-2', change: -3} },
      { name: 'Accepts the lower change bound', input: [{sku: 'a', change: -50}], expected: {sku: 'A', change: -50} },
      { name: 'Accepts the upper change bound and SKU length', input: [{sku: ' abcdef123456 ', change: 50}], expected: {sku: 'ABCDEF123456', change: 50} },
      { name: 'Accepts a single hyphen', input: [{sku: '-', change: 1}], expected: {sku: '-', change: 1} },
      { name: 'Checks the character set after uppercase normalization', input: [{sku: 'ß', change: 1}], expected: {sku: 'SS', change: 1} },
      { name: 'Rejects zero change', input: [{sku: 'A', change: 0}], expected: null },
      { name: 'Rejects a negative value below the bound', input: [{sku: 'A', change: -51}], expected: null },
      { name: 'Rejects a positive value above the bound', input: [{sku: 'A', change: 51}], expected: null },
      { name: 'Rejects fractional changes', input: [{sku: 'A', change: 1.5}], expected: null },
      { name: 'Rejects numeric strings', input: [{sku: 'A', change: '2'}], expected: null },
      { name: 'Rejects a blank SKU', input: [{sku: '\t \n', change: 1}], expected: null },
      { name: 'Rejects a normalized SKU above its length limit', input: [{sku: 'abcdefgh12345', change: 1}], expected: null },
      { name: 'Rejects internal spaces', input: [{sku: 'a b', change: 1}], expected: null },
      { name: 'Rejects punctuation outside the character set', input: [{sku: 'a_b', change: 1}], expected: null },
      { name: 'Rejects non-ASCII letters after normalization', input: [{sku: 'café', change: 1}], expected: null },
      { name: 'Rejects non-string SKU', input: [{sku: 12, change: 1}], expected: null },
      { name: 'Rejects missing fields', input: [{sku: 'A'}], expected: null },
      { name: 'Rejects null', input: [null], expected: null },
      { name: 'Rejects arrays', input: [[{sku: 'A', change: 1}]], expected: null },
      { name: 'Rejects primitive requests', input: [true], expected: null },
    ],
  },
  {
    id: 'parse-delivery-window', title: 'Validate a delivery window', category: 'Backend core', format: 'backend',
    context: 'A scheduling form has different rules for pickup and delivery. Return one predictable error when several fields are invalid.',
    prompt: 'Implement deliveryWindow(input). Return {ok: false, error: "INVALID_REQUEST"} for null, arrays, or non-objects. For an object, mode must be exactly "pickup" or "delivery"; otherwise return INVALID_MODE. For delivery only, address must be a string whose trimmed length is 1–80; otherwise return INVALID_ADDRESS. Ignore address entirely for pickup and return address: null. Finally, minutes defaults to 20 only when missing or undefined; otherwise it must be an integer from 0 through 120, or return INVALID_MINUTES. For valid input return {ok: true, mode, address, minutes}, using the trimmed delivery address. Errors always use {ok: false, error}.',
    brief: { summary: 'Implement deliveryWindow(input). Errors always use {ok: false, error}.', rules: [
      'Return {ok: false, error: "INVALID_REQUEST"} for null, arrays, or non-objects.',
      'For an object, mode must be exactly "pickup" or "delivery"; otherwise return INVALID_MODE.',
      'For delivery only, address must be a string whose trimmed length is 1–80; otherwise return INVALID_ADDRESS.',
      'Finally, minutes defaults to 20 only when missing or undefined; otherwise it must be an integer from 0 through 120, or return INVALID_MINUTES.',
      'For valid input return {ok: true, mode, address, minutes}, using the trimmed delivery address.',
    ], edgeCases: [
      'Ignore address entirely for pickup and return address: null.',
    ] },
    example: { input: 'deliveryWindow({mode: "pickup", address: 42, minutes: 0})', output: '{ok: true, mode: "pickup", address: null, minutes: 0}' },
    note: 'Error precedence is request shape → mode → required address → minutes. Do not trim or change mode, coerce numbers, or change input. Ignore extra properties. Address length uses JavaScript string length after trim. The contract allows a trimmed address of 1 to 80 characters; authored test data never exceeds 200 characters in total. Requests have at most 20 properties. These are parsed objects, not a live scheduling or HTTP test.',
    vocabulary: [{ term: 'Precedence', meaning: 'the order that decides which rule wins when several apply' }, { term: 'Default', meaning: 'a specified value used when input is absent, rather than invalid' }],
    planPrompt: 'Restate the success and error contracts. Choose a conflicting invalid request and predict its exact error before coding.',
    starter: `type WindowResult = {ok: true; mode: 'pickup' | 'delivery'; address: string | null; minutes: number} | {ok: false; error: string}
function deliveryWindow(input: unknown): WindowResult {
  // Implement the written contract.
  return {ok: false, error: 'INVALID_REQUEST'}
}
`,
    functionName: 'deliveryWindow', preserveInput: true,
    hints: ['The contract orders errors and makes one field conditional. Missing minutes and invalid minutes are different.', 'Validate shape and mode, then address only for delivery. Apply the minutes default only to undefined, preserving zero.', 'Use early returns in the specified order. Keep pickup address null, require Number.isInteger(minutes) within both bounds, and create a fresh success object.'],
    checks: [
      { name: 'Pickup ignores an invalid address and preserves zero minutes', input: [{mode: 'pickup', address: 42, minutes: 0}], expected: {ok: true, mode: 'pickup', address: null, minutes: 0} },
      { name: 'Delivery trims its address and defaults missing minutes', input: [{mode: 'delivery', address: ' 12 Main St '}], expected: {ok: true, mode: 'delivery', address: '12 Main St', minutes: 20} },
      { name: 'Explicit undefined minutes uses the default', input: [{mode: 'pickup', minutes: undefined}], expected: {ok: true, mode: 'pickup', address: null, minutes: 20} },
      { name: 'Accepts the upper minute and address limits', input: [{mode: 'delivery', address: ' ' + 'a'.repeat(80) + ' ', minutes: 120, extra: true}], expected: {ok: true, mode: 'delivery', address: 'a'.repeat(80), minutes: 120} },
      { name: 'Request shape wins before other errors', input: [null], expected: {ok: false, error: 'INVALID_REQUEST'} },
      { name: 'Rejects an array request', input: [[]], expected: {ok: false, error: 'INVALID_REQUEST'} },
      { name: 'Rejects a primitive request', input: ['pickup'], expected: {ok: false, error: 'INVALID_REQUEST'} },
      { name: 'Mode wins before address and minutes errors', input: [{mode: ' PICKUP ', address: null, minutes: -1}], expected: {ok: false, error: 'INVALID_MODE'} },
      { name: 'Rejects missing mode', input: [{}], expected: {ok: false, error: 'INVALID_MODE'} },
      { name: 'Address wins before minutes errors', input: [{mode: 'delivery', address: ' \t ', minutes: -1}], expected: {ok: false, error: 'INVALID_ADDRESS'} },
      { name: 'Delivery requires an address', input: [{mode: 'delivery'}], expected: {ok: false, error: 'INVALID_ADDRESS'} },
      { name: 'Rejects a non-string delivery address', input: [{mode: 'delivery', address: 12}], expected: {ok: false, error: 'INVALID_ADDRESS'} },
      { name: 'Rejects an address above its limit', input: [{mode: 'delivery', address: 'a'.repeat(81)}], expected: {ok: false, error: 'INVALID_ADDRESS'} },
      { name: 'Null minutes is invalid rather than absent', input: [{mode: 'pickup', minutes: null}], expected: {ok: false, error: 'INVALID_MINUTES'} },
      { name: 'Rejects minutes below the lower bound', input: [{mode: 'pickup', minutes: -1}], expected: {ok: false, error: 'INVALID_MINUTES'} },
      { name: 'Rejects minutes above the upper bound', input: [{mode: 'delivery', address: 'A', minutes: 121}], expected: {ok: false, error: 'INVALID_MINUTES'} },
      { name: 'Rejects fractional minutes', input: [{mode: 'pickup', minutes: 0.5}], expected: {ok: false, error: 'INVALID_MINUTES'} },
      { name: 'Rejects numeric strings', input: [{mode: 'pickup', minutes: '20'}], expected: {ok: false, error: 'INVALID_MINUTES'} },
    ],
  },
  {
    id: 'validate-import-batch', title: 'Validate a batch before importing', category: 'Backend core', format: 'backend',
    context: 'An import must accept every row or reject the whole batch. No partial successful output is returned.',
    prompt: 'Implement importBatch(input) using these rules in order. (1) Batch shape: input must be an array of 1–50 rows; otherwise return {ok: false, index: -1, error: "INVALID_BATCH"}. Then examine rows in input order and stop at the first error. (2) Row shape: a row must be a non-null object that is not an array, with a string id and an integer amount; otherwise return {ok: false, index, error: "INVALID_ROW"}. (3) Id: trim and lowercase it; the result must contain 1–10 ASCII lowercase letters or digits, or the row is INVALID_ROW. (4) Amount: an integer from 0 through 9999, or the row is INVALID_ROW. (5) Duplicates: only after a row passes rules 2–4, if its normalized id matches an earlier accepted row, return {ok: false, index, error: "DUPLICATE_ID"}. (6) Output: if every row passes, return {ok: true, rows} with only the normalized id and amount, in original order.',
    brief: {
      summary: 'Implement importBatch(input) by applying rules 1 to 6 in order. Examine rows in input order and stop at the first error.',
      rules: [
        'Batch shape: input must be an array of 1–50 rows; otherwise return {ok: false, index: -1, error: "INVALID_BATCH"}.',
        'Row shape: a row must be a non-null object that is not an array, with a string id and an integer amount; otherwise return {ok: false, index, error: "INVALID_ROW"}.',
        'Id: trim and lowercase it; the result must contain 1–10 ASCII lowercase letters or digits, or the row is INVALID_ROW.',
        'Amount: an integer from 0 through 9999, or the row is INVALID_ROW.',
        'Duplicates: only after a row passes rules 2–4, if its normalized id matches an earlier accepted row, return {ok: false, index, error: "DUPLICATE_ID"}.',
        'Output: if every row passes, return {ok: true, rows} with only the normalized id and amount, in original order.',
      ],
      edgeCases: ['Rule 3 normalizes the id before rule 5 compares it, and rule 5 never runs for a row that already failed.'],
    },
    example: { input: 'importBatch([{id: " A1 ", amount: 0}, {id: "a1", amount: 2}])', output: '{ok: false, index: 1, error: "DUPLICATE_ID"}' },
    note: 'index is zero-based. A duplicate id with an invalid amount gives INVALID_ROW, because rule 5 runs only after the row passes. Do not coerce fields or change the input. Ignore extra row properties. Authored rows have at most 20 properties and strings at most 200 characters. No data is actually imported; this function checks an all-or-nothing boundary policy.',
    vocabulary: [{ term: 'All-or-nothing', meaning: 'accepting the complete operation or rejecting it without returning partial success' }, { term: 'Duplicate', meaning: 'a value already present under the contract’s comparison rules' }],
    planPrompt: 'Describe the exact result for a malformed batch, conflicting row errors, and a valid batch. Name a case where normalization changes duplicate detection.',
    starter: `type ImportResult = {ok: true; rows: {id: string; amount: number}[]} | {ok: false; index: number; error: string}
function importBatch(input: unknown): ImportResult {
  // Implement the written contract.
  return {ok: false, index: -1, error: 'INVALID_BATCH'}
}
`,
    functionName: 'importBatch', preserveInput: true,
    hints: ['Keep batch shape, individual row validity, and uniqueness as separate rules. Failure returns no partial rows.', 'Process rows in order, keeping normalized IDs already accepted. Validate all fields before looking for a duplicate.', 'Use a Set for accepted IDs and a fresh result array. Reject the first invalid or duplicate row with its index; add the normalized ID only after both checks pass.'],
    checks: [
      { name: 'Normalizes rows, preserves zero and order, and ignores extra fields', input: [[{id: ' B2 ', amount: 9999, note: 'keep out'}, {id: 'a1', amount: 0}]], expected: {ok: true, rows: [{id: 'b2', amount: 9999}, {id: 'a1', amount: 0}]} },
      { name: 'Detects duplicates after normalization', input: [[{id: ' A1 ', amount: 0}, {id: 'a1', amount: 2}]], expected: {ok: false, index: 1, error: 'DUPLICATE_ID'} },
      { name: 'Invalid row wins over its duplicate ID', input: [[{id: 'a', amount: 1}, {id: 'A', amount: -1}]], expected: {ok: false, index: 1, error: 'INVALID_ROW'} },
      { name: 'First error wins over a later malformed row', input: [[{id: 'a', amount: 1}, {id: 'a', amount: 2}, null]], expected: {ok: false, index: 1, error: 'DUPLICATE_ID'} },
      { name: 'Rejects a non-array batch', input: [{}], expected: {ok: false, index: -1, error: 'INVALID_BATCH'} },
      { name: 'Rejects null batch', input: [null], expected: {ok: false, index: -1, error: 'INVALID_BATCH'} },
      { name: 'Rejects an empty batch', input: [[]], expected: {ok: false, index: -1, error: 'INVALID_BATCH'} },
      { name: 'Accepts exactly 50 distinct rows', input: [Array.from({length: 50}, (_, i) => ({id: String(i), amount: i}))], expected: {ok: true, rows: Array.from({length: 50}, (_, i) => ({id: String(i), amount: i}))} },
      { name: 'Batch size wins before row validation', input: [Array.from({length: 51}, () => null)], expected: {ok: false, index: -1, error: 'INVALID_BATCH'} },
      { name: 'Rejects null rows without partial output', input: [[{id: 'a', amount: 1}, null]], expected: {ok: false, index: 1, error: 'INVALID_ROW'} },
      { name: 'Rejects array rows', input: [[[]]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects primitive rows', input: [[true]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects missing fields', input: [[{id: 'a'}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects non-string IDs', input: [[{id: 1, amount: 1}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects blank IDs', input: [[{id: ' \t ', amount: 1}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Accepts an ID exactly at its length limit', input: [[{id: ' abcdef1234 ', amount: 1}]], expected: {ok: true, rows: [{id: 'abcdef1234', amount: 1}]} },
      { name: 'Checks the character set after lowercase normalization', input: [[{id: 'K', amount: 1}]], expected: {ok: true, rows: [{id: 'k', amount: 1}]} },
      { name: 'Rejects IDs above their length limit', input: [[{id: 'abcdef12345', amount: 1}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects internal spaces', input: [[{id: 'a b', amount: 1}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects non-ASCII IDs', input: [[{id: 'café', amount: 1}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects punctuation', input: [[{id: 'a-b', amount: 1}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects amounts above the upper bound', input: [[{id: 'a', amount: 10000}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects fractional amounts', input: [[{id: 'a', amount: 0.5}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
      { name: 'Rejects numeric strings', input: [[{id: 'a', amount: '1'}]], expected: {ok: false, index: 0, error: 'INVALID_ROW'} },
    ],
  },
]
