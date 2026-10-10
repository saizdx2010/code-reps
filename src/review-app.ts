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
    example: 'I clamp current, collect the first, last, current and neighbor pages, sort them, and walk the list. A gap of two adds the hidden page, a larger gap adds "...". The work depends on a handful of pages, not on total. Passing checks does not prove the buttons are keyboard operable or labeled for assistive technology.',
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
  'group-items-by-heading': {
    plan: ['Decide what text marks a group and trim it.', 'Keep titles in a list for each heading as you meet it.', 'Skip blank headings before creating a group.'],
    explanation: ['Trace two headings that interleave and say which group appears first.', 'Explain why "tips" and "Tips" stay separate.', 'Say why titles keep their spacing while headings are trimmed.'],
    example: 'I trim each heading and skip the blank ones. A map keeps one titles list per heading, and its insertion order gives first-appearance order. For Billing, Account, Billing, Account the groups are Billing then Account, with titles kept in input order. Each item is visited once, so the time is O(n) and the extra space is O(n). The checks do not show how headings are announced or styled.',
  },
  'filter-chip-summary': {
    plan: ['Clean each name and drop blanks first.', 'Keep only the first spelling of each case-insensitive name.', 'Split the distinct names into visible chips and a hidden count.'],
    explanation: ['Trace duplicate names that differ only by case.', 'Explain why the hidden count counts distinct filters.', 'Say what this does not decide, such as the chip layout.'],
    example: 'I trim each name, skip blanks, and remember lowercase keys I have already kept. Distinct names go in order; the first maxChips become chips and the remainder are counted as hidden. For A, a, B, C, c with a limit of two, the chips are A and B and one filter is hidden. Work is linear in the number of names, with a set of kept keys as extra space.',
  },
  'parse-sort-param': {
    plan: ['Check the type before reading text.', 'Trim the text and read the dash as direction.', 'Accept only the three exact field names.'],
    explanation: ['Trace "- title" and explain why the space makes it invalid.', 'Explain why a repeated parameter is rejected by type.', 'Explain why blank text uses the default while an unknown field is an error.'],
    example: 'I return the default for undefined or blank text. Any other non-string is invalid. Otherwise I trim, check for a leading dash, and compare the remaining text exactly with the three allowed fields. "--title" leaves "-title" after the first dash, which is not allowed. The work is constant for each value and no data is stored.',
  },
  'page-response-envelope': {
    plan: ['Count the pages with a minimum of one.', 'Reject a page past the end before any link.', 'Build the three links from one pattern and null the ends.'],
    explanation: ['Trace 21 items at 10 per page through the last page.', 'Explain why an empty collection still has one page.', 'Explain why the envelope must not contain the items.'],
    example: 'I compute totalPages as the rounded-up quotient, at least one. If the requested page is larger, I return PAGE_NOT_FOUND. Otherwise I build self from the page and size, prev only when the page is above one, and next only before the last page. For 21 items at 10 per page, page 3 has no next link. The work is constant apart from the link text.',
  },
  'frontend-screen-message': {
    plan: ['Write the words for each of the three states.', 'Decide what ready returns for an empty name.', 'Return from each condition so only one message is produced.'],
    explanation: ['Trace one status through your conditions and say which line returns.', 'Explain why the name is never changed.', 'Say what these checks do not cover, such as how the words look on a screen.'],
    example: 'I test the status with one condition per state and return its message as soon as it matches. Loading and error build text around the name; ready returns the name unchanged, so an empty name stays empty. The checks cover each state and an empty name; they do not show how the text looks on screen.',
  },
  'backend-check-quantity': {
    plan: ['List the rules a value must meet: a number, whole, and in range.', 'Decide which test to run first so later tests are safe.', 'Name the values at each end of the range.'],
    explanation: ['Trace "3", 2.5, and 11 and say which rule rejects each.', 'Explain why the value is returned unchanged instead of converted.', 'Say what this does not cover, such as a full request body.'],
    example: 'I reject anything whose typeof is not number, then anything that is not a whole number, then return the value only when it is at least 1 and at most 10. Strings are rejected rather than converted. The checks cover both ends and the wrong-type cases; they do not validate a whole request.',
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
  'group-items-by-heading': {
    reasoning: 'Grouping is a single pass that keys each title by its normalized heading. Insertion order of the keyed structure records first appearance, so the output order follows from the data rather than from a separate sort.',
    trace: 'Items Billing/Invoices, Account/Password, Billing/Refunds: Billing is created first and receives Invoices, then Refunds is appended to it. Account is second. A blank heading at the front of the list would be skipped without creating a group.',
    alternative: 'Sorting the items by heading would group them too, but it would reorder the groups alphabetically instead of by first appearance and would need a stable sort to keep titles in input order. A plain object keyed by heading works, but it puts numeric-looking headings in their own order, so a Map is safer here.',
    counterexample: 'Creating the group before the blank check gives a group with an empty heading. Lowercasing keys while storing the original spelling would merge "tips" and "Tips" under one heading the contract keeps separate.',
    transfer: 'Add a count to each group and sort groups by that count, breaking ties by first appearance. Decide whether the sort changes the grouping logic or only the final output. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'filter-chip-summary': {
    reasoning: 'Distinctness is decided by a case-folded key, while display uses the first trimmed spelling. The visible chips are a prefix of the distinct list, so the hidden count is the length difference.',
    trace: 'For [" Red", "red", "Large", "  ", "Cotton"] with a limit of two: " Red" is kept as Red; "red" matches its key and is dropped; "Large" is kept; the blank is dropped; Cotton is the third distinct name, so it is hidden. Result: chips Red and Large, hiddenCount 1.',
    alternative: 'Deduplicating after slicing would let repeats consume chip slots and undercount the hidden filters. Keeping the last spelling would change what the learner sees for names they typed first.',
    counterexample: 'Counting raw entries makes ["A", "a", "B"] show two hidden filters with a limit of one, when only B is hidden. Using toUpperCase for the key is fine here, but comparing only the untrimmed text lets " Red" and "Red" count as two filters.',
    transfer: 'Add a removed-filter list that keeps each name visible after a user deletes its chip, while the summary keeps counting only active filters. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'parse-sort-param': {
    reasoning: 'Each rule reads the value once, from the most general to the most specific: type, then blank, then direction, then the exact allow list. The allow list is the only place a field name can come from, so client text never becomes a sort key by accident.',
    trace: 'For "--title": it is a string and not blank; the leading dash sets desc and leaves "-title"; that is not in the allow list, so INVALID_SORT. For "  -createdAt  ": trimming gives "-createdAt", direction desc, field createdAt.',
    alternative: 'A schema library would validate the same allow list for several endpoints. A regular expression could match the whole format, but it would be harder to read and to extend with a new field. Mapping an unknown field to the default would hide mistakes the client needs to fix.',
    counterexample: 'Lowercasing before comparing accepts "CREATEDAT" and "Title" as fields, which the contract forbids. Stripping every dash with replace would accept "title-" and "--title" as valid.',
    transfer: 'Allow two sort fields at once, such as -priority,title, and decide how invalid parts affect the whole parameter. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'page-response-envelope': {
    reasoning: 'The page count is fixed by the data size and page size, and every link is produced from one pattern. Rejecting a page past the end first means no link ever points at a page that does not exist.',
    trace: 'For 21 items with page size 10, totalPages is 3. Page 3 gives self "?page=3&pageSize=10", prev "?page=2&pageSize=10", and next null because 3 is the last page. Page 4 would fail with PAGE_NOT_FOUND before any link is built.',
    alternative: 'Returning the last page silently for an out-of-range request is friendlier, but then the client cannot tell its page number was wrong. Using floor instead of ceiling loses the partial final page.',
    counterexample: 'Computing totalPages as floor(21 / 10) gives 2 and drops the last item from navigation. Setting next to the page after the last one for every page sends clients to an empty page.',
    transfer: 'Switch to cursor pagination, where the response returns the id of the last item instead of a page number. Decide which links remain and how an empty result is represented. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'frontend-screen-message': {
    reasoning: 'The three statuses are mutually exclusive, so one condition per status produces exactly one message. Ready returns the name itself, which is why an empty name gives an empty string.',
    trace: 'For ("error", "profile") the loading test fails, the error test matches, and the result is "Could not load profile". For ("ready", "") both tests fail and the name "" is returned.',
    alternative: 'A lookup object of message builders keeps the three states together, but for three short messages plain if statements are easier to read and trace.',
    counterexample: 'Returning "Loading " + name without the dots, or checking ready first and returning name for every status, passes the ready check but fails the loading and error checks.',
    transfer: 'Add an "empty" status that shows "No profile yet". Decide where it goes among the conditions and what name it uses. This change is self-reviewed; the original checks do not cover it.',
  },
  'backend-check-quantity': {
    reasoning: 'Each rule is tested before the next depends on it: the type first, then wholeness, then the range. The value is returned only when all three hold, so no invalid value reaches later code.',
    trace: 'For "3" the type test fails and null returns. For 2.5 the type passes and the wholeness test fails. For 10 every rule holds, so 10 is returned; 11 fails the range.',
    alternative: 'A single combined condition is shorter, but separate early returns make it clear which rule rejected a value. Coercing with Number("3") would accept text, which this contract forbids.',
    counterexample: 'Checking only value >= 1 && value <= 10 accepts 2.5. Using < 10 rejects the valid value 10. Using typeof alone accepts NaN, though checks here never pass it.',
    transfer: 'Allow a quantity of 0 only when a second argument says the cart is being cleared. Decide the new rule order and write the conflicting cases first. This is self-reviewed, not checked by the original cases.',
  },
}
