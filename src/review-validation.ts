import type { RepDepth } from './rep-depth.ts'

export const validationGuides = {
  'validate-stock-adjustment': {
    plan: ['Separate shape, type, normalization, and allowed values.', 'Reject zero, fractions, and out-of-range changes.', 'Create a result without changing input.'],
    explanation: ['Trace a normalized SKU and both numerical limits.', 'Explain rejection versus coercion and clamping.', 'Account for string-processing costs.'],
    example: 'I validate the object and field types, normalize the SKU, and test the allowed character set and length. I accept a nonzero integer within both limits and return a fresh object. Trimming and uppercase conversion scale with text length; behavioral checks do not prove which approach I used.',
  },
  'parse-delivery-window': {
    plan: ['Follow the specified error precedence.', 'Validate address only when delivery requires it.', 'Default absent minutes while preserving zero.'],
    explanation: ['Trace a request with multiple invalid fields.', 'Explain why pickup ignores address and null minutes is rejected.', 'Distinguish parsed-object checks from real scheduling behavior.'],
    example: 'I reject invalid shape, then mode, then a required delivery address, then minutes. Pickup always returns null address. Undefined minutes defaults to 20, but zero remains zero and null is invalid. Address trimming scales with its length. Passing these checks establishes this boundary policy, not a running delivery service.',
  },
  'validate-import-batch': {
    plan: ['Reject invalid batch shape and size first.', 'Validate each row before checking its normalized ID for duplication.', 'Return no partial success after the first error.'],
    explanation: ['Trace two differently written IDs that normalize equally.', 'Explain why invalid amount wins over duplicate ID in the same row.', 'Separate validation output from an actual atomic storage operation.'],
    example: 'I validate the array, then visit rows in order with a set of accepted IDs and a fresh output array. I validate every field before testing uniqueness. The first error returns only its index and error. Work scales with rows and ID text; output and the set scale with accepted rows. This does not perform or test a database transaction.',
  },
}

export const validationDepth: Record<string, RepDepth> = {
  'validate-stock-adjustment': {
    reasoning: 'A success object is created only after shape, type, normalized text, and numeric rules hold. Normalization never repairs an invalid number.',
    trace: 'For {sku: " ab-2 ", change: -50}, trim gives ab-2, uppercase gives AB-2, and -50 is an allowed boundary. With change 0, return null even though the SKU is valid.',
    alternative: 'Explicit guards keep the small contract visible; a reusable schema may help many endpoints. Both must encode this exact character set and nonzero inclusive range. String processing depends on SKU length.',
    counterexample: 'Number(change) accepts "2", which is forbidden. Checking raw length rejects a valid padded 12-character SKU; trimming the input property changes caller data.',
    transfer: 'Allow a zero adjustment only when reason is exactly "audit". Define shape and precedence before changing the validator. This new contract is self-reviewed, not checked by the original cases.',
  },
  'parse-delivery-window': {
    reasoning: 'Ordered guards ensure conflicting errors always produce the documented response. The address rule belongs only to delivery; the minutes default belongs only to absence.',
    trace: 'For delivery with blank address and minutes -1, INVALID_ADDRESS wins. For pickup with address 42 and minutes 0, address is ignored and the success returns null address and zero minutes.',
    alternative: 'A collected list of errors could be useful for a form, but returning all errors would change this contract. Early returns make its priority visible. Only delivery address processing grows with text length.',
    counterexample: 'minutes || 20 replaces valid zero. minutes ?? 20 accepts null, although this contract rejects it. Requiring address for pickup wrongly rejects the example.',
    transfer: 'Add a scheduled mode requiring a date and decide where date errors fit in the precedence. Write conflicting examples first; the original checks do not assess this variation.',
  },
  'validate-import-batch': {
    reasoning: 'Before each row, accepted output contains only valid rows with distinct normalized IDs. Validating before duplicate detection and stopping immediately preserves the earliest-error rule.',
    trace: 'Row 0 {id: " A1 ", amount: 0} becomes a1. Row 1 {id: "a1", amount: -1} gives INVALID_ROW at index 1; changing its amount to 2 gives DUPLICATE_ID instead. Neither response includes partial rows.',
    alternative: 'Comparing each normalized ID against every earlier row avoids a set but can require quadratic comparisons. A set uses storage proportional to accepted rows and expected constant-time lookup. Include ID normalization work in the time estimate.',
    counterexample: 'Checking duplicates on raw IDs misses " A1 " versus "a1". Returning rows collected before an error violates all-or-nothing output. Checking uniqueness before amount chooses the wrong error.',
    transfer: 'Design a preview that reports every invalid row while still prohibiting writes until the batch is valid. Decide how repeated invalid IDs should be reported. This is a separately self-reviewed contract.',
  },
}
