import type { RepDepth } from './rep-depth.ts'

export const appGuides = {
  'frontend-sort-table': {
    plan: ['Choose a comparable value for each column.', 'Sort a copy, not the caller\'s array.', 'Decide how ties behave in both directions.'],
    explanation: ['Trace two tied rows through an ascending and a descending sort.', 'Explain why reversing the ascending result changes tie order.', 'Account for the sorting cost and the copy.'],
    example: 'I copy the rows with their original positions, pick a lowercase name or a number as the sort value, and compare values. For descending I flip only the value comparison, then use the original position to break ties. Sorting costs O(n log n) time and O(n) extra space; the input is never changed. These checks do not show that the table looks or announces its sort order correctly.',
  },
  'frontend-form-errors': {
    plan: ['List each field\'s rules in precedence order.', 'Trim before testing blank, length, and shape.', 'Add a key only when a field has an error.'],
    explanation: ['Trace a field that breaks two rules and say which message wins.', 'Explain why digits are tested before the range.', 'Say what this does not cover, such as when messages first appear.'],
    example: 'For each field I trim, then check required, format, and range in that order and stop at the first failure. I add only failing fields to a new object. Work scales with text length. The checks cover the stated rules; when to show an error, focus, and screen-reader announcements need separate review.',
  },
  'frontend-pagination-controls': {
    plan: ['Decide which page numbers are always shown.', 'Order them without repeats.', 'Decide what fills each gap.'],
    explanation: ['Trace a middle page and a page near an end.', 'Explain why one hidden page is shown instead of an ellipsis.', 'State how out-of-range current values are handled.'],
    example: 'I clamp current, collect the first, last, current and neighbor pages, sort them, and walk the list. A gap of two adds the hidden page, a larger gap adds "...". The work depends on a handful of pages, not on total. Passing checks does not prove the buttons are keyboard operable or labelled for assistive technology.',
  },
  'backend-query-filters': {
    plan: ['Write each field\'s default and rule.', 'Reject non-string values before normalizing.', 'Follow the stated error order.'],
    explanation: ['Trace a query with two invalid fields.', 'Explain missing-or-blank versus invalid.', 'Explain why a repeated parameter is rejected.'],
    example: 'I reject a bad query shape, then validate status, limit, and tag in order. Missing or blank text uses a default; other non-strings are invalid. Limit is checked as digits before conversion, then against 1 through 50. Work scales with value length. The checks use parsed objects and do not test real URL parsing or a database.',
  },
  'backend-rate-limit': {
    plan: ['Find the start and end of the current window.', 'Count only times inside that window and not after now.', 'Compute the wait from the next window start.'],
    explanation: ['Trace requests just before and exactly at a window boundary.', 'Explain the burst a fixed window allows across a boundary.', 'Explain why time is passed in.'],
    example: 'I compute the window start with floor division, count the recorded times from that start up to now, and compare with the limit. When blocked I return the time until start plus windowMs. One scan costs O(n). A fixed window can allow a double burst around a boundary; these checks cover the decision only, not storage or concurrent requests.',
  },
  'backend-error-response': {
    plan: ['List the known codes and their responses.', 'Treat everything else as an internal error.', 'Build the body only from your own table.'],
    explanation: ['Trace a known code with extra fields and an unknown code.', 'Explain what could leak if the thrown message were copied.', 'Explain why inherited property names need care.'],
    example: 'I check the error is an object with an own string code, look that code up in a table I wrote, and return the table\'s status and message. Anything else gets the generic 500 response. Thrown text never reaches the body. The lookup is O(1). This tests the mapping only, not logging or real HTTP responses.',
  },
}

export const appDepth: Record<string, RepDepth> = {
  'frontend-sort-table': {
    reasoning: 'Each row gets a sort key and its original position. Ordering by key then position gives a total order, so equal rows are ordered the same way every time, in either direction.',
    trace: 'Rows Pear/4 (position 0) and Fig/4 (position 2) tie on qty. Descending flips only the key comparison, so apple/9 comes first, then Pear before Fig by position, then Apple/2.',
    alternative: 'Array.prototype.sort on a copy is stable in modern engines, so ascending ties already keep order; descending still needs a comparator that does not reverse ties. Sorting only on demand costs O(n log n) per click; keeping the table presorted trades storage for faster clicks.',
    counterexample: 'Sorting ascending then calling reverse() puts tied rows in reverse order, so Fig would come before Pear. Calling sort directly on the input also reorders the caller\'s list.',
    transfer: 'Add a second sort column so ties on the first column use the second. State which column wins and how direction applies to each before coding. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'frontend-form-errors': {
    reasoning: 'Each field is a short ordered list of rules, and the first failing rule supplies the only message. Required, then format, then range makes later rules safe to apply, since a number is only read after the text is known to be digits.',
    trace: 'For age "12.5": not blank, so skip required; the digit pattern fails on the dot, so the message is "Age must be a whole number". The range rule never runs. For age "007": digits pass, the value 7 is below 18, so the range message appears.',
    alternative: 'A list of rule functions per field is easy to extend for large forms; direct if statements are easier to read for three fields. Collecting all messages per field would change the contract by showing several at once.',
    counterexample: 'Number(age) turns " " into 0 and "1e2" into 100, so blank or exponent text slips past the rules. Testing range before format reports a range error for "-5" instead of a format error.',
    transfer: 'Add a password field that must match a confirm field. Decide which field carries the mismatch message and where it sits in precedence. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'frontend-pagination-controls': {
    reasoning: 'The always-shown pages form a small ordered set with no repeats. Any two neighbors in that set have a gap, and the gap size alone decides the output: nothing, the one hidden page, or an ellipsis.',
    trace: 'For current 4, total 10 the set is 1, 3, 4, 5, 10. The gap from 1 to 3 hides only page 2, so show 2. The gap from 5 to 10 hides four pages, so show "...". Result: 1 2 3 4 5 ... 10.',
    alternative: 'Building the list from numeric ranges (left edge, middle window, right edge) works but needs separate cases for pages near each end. The set-and-gap method has one rule for every position at the cost of a small sort.',
    counterexample: 'Always inserting "..." for any gap shows "1 ... 3" and hides one page the ellipsis could have shown. Forgetting to clamp current 99 of 10 shows neighbors 98 and 100.',
    transfer: 'Show two neighbors on each side instead of one. State what the single-hidden-page rule becomes and test the first and last pages. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-query-filters': {
    reasoning: 'Query values are untrusted text, so each field is validated in a fixed order and only then converted. Separating "absent, so use the default" from "present but invalid, so reject" keeps defaults from hiding mistakes.',
    trace: 'For {status: "x", limit: "0"}, the query is an object; status "x" is not allowed, so return INVALID_STATUS before limit is looked at. For {limit: " 007 "} trim gives "007", digits pass, the number is 7 and within 1 to 50.',
    alternative: 'A schema library centralizes rules for many endpoints; explicit steps keep this small contract visible. Clamping an out-of-range limit to 50 is friendlier but would change the contract by accepting what this one rejects.',
    counterexample: 'Number("") is 0 and Number("1.5") is 1.5, so converting first lets blank or fractional limits through. Using limit || 10 turns an explicit invalid "0" into the default instead of an error.',
    transfer: 'Add a sort parameter with allowed values and a default, and decide whether it comes before or after tag in the error order. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-rate-limit': {
    reasoning: 'Within one window the decision depends only on how many earlier times fall in [start, now]. The window start comes from floor division, so every time maps to exactly one window and a boundary time belongs to the later window.',
    trace: 'With windowMs 1000, limit 3, and times [1000, 1200, 1300]: at now 1999 all three count, so the answer is blocked with retry 1 ms. At now 2000 the window starts at 2000, none of the times count, and the request is allowed with remaining 2.',
    alternative: 'A sliding window counts requests in the last windowMs milliseconds and avoids the boundary burst, but needs more bookkeeping. A fixed window is simpler and stores one count per window if you keep a counter instead of every time.',
    counterexample: 'Counting times in the last windowMs (now - windowMs) instead of the aligned window blocks the request at 2000 above, though a fresh window has begun. Counting times later than now includes impossible future requests.',
    transfer: 'Change to a sliding window and compute how long to wait for the oldest counted request to expire. Define the boundary rule first. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'backend-error-response': {
    reasoning: 'The response is built only from a table the server author controls, so internal text can never reach the client. Unknown input falls to a single safe default, which means a new unplanned error fails closed.',
    trace: 'For {code: "CONFLICT", sql: "UPDATE orders ..."}, the own string code CONFLICT is in the table, so return 409 and the table message; sql is never read. For {code: "toString"}, the name is not an own table key, so the result is the 500 response.',
    alternative: 'A switch on the code is explicit and avoids inherited-property traps; a Map or an object with Object.hasOwn is shorter for many codes. Returning error.message would be convenient but exposes internals.',
    counterexample: 'Looking up table[error.code] on a plain object finds inherited names such as toString or constructor and returns a function instead of a response. Spreading the error into the body copies stack and sql fields.',
    transfer: 'Add a validation error that carries field names the client may see. Decide which parts of the thrown error are safe and how the table stays the only source of text. This changed contract is self-reviewed, not checked by the original cases.',
  },
}
