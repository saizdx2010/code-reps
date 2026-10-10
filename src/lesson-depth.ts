import { browserStateLessonDepth } from './review-browser-state.ts'
import { dsaLessonDepth } from './review-dsa-lessons.ts'
import { practicalLessonDepth } from './review-practical.ts'
export type LessonDepth = { title: string; code: string; reasoning: string; challenge: string; answer: string }

export const lessonDepth: Record<string, LessonDepth> = {
  'state-modeling': browserStateLessonDepth,
  ...practicalLessonDepth,
  ...dsaLessonDepth,
  "values": {
    "title": "A binding and an object can change independently",
    "code": "const first = { score: 1 };\nconst second = first;\nsecond.score = 2;\n// first.score is now 2.",
    "reasoning": "Both names refer to the same object. Updating through second changes that object; neither binding is reassigned. A copied object would have a different identity. This is why const does not guarantee immutable data.",
    "challenge": "Predict what happens after const copy = { ...first }; copy.score = 9. Explain the value of first.score.",
    "answer": "first.score remains 2: the spread creates a separate object for these primitive properties. Nested objects would still share references unless copied too."
  },
  "control-flow": {
    "title": "Order the branches and make the loop progress",
    "code": "function label(score: number) {\n  if (score >= 90) return 'A'\n  if (score >= 80) return 'B'\n  return 'C or lower'\n}\n\nlet value = 9\nlet steps = 0\nwhile (value > 1) {\n  value = Math.floor(value / 2)\n  steps++\n}",
    "reasoning": "A return ends the function, so the first matching branch wins. Its order therefore sets the boundaries: 85 reaches B only because it failed the 90 test. A loop needs three things: a starting value, a condition that can become false, and a change on each pass that moves toward that end. Without progress, the same condition stays true forever.",
    "challenge": "A learner writes while (value > 1) { value = value / 2; steps++ } for 9. Predict the step count, then explain the repair.",
    "answer": "The loop counts 4 steps instead of 3. The value becomes fractional (4.5, 2.25, 1.125, 0.5625), so an extra pass runs while it is still above 1. Math.floor keeps each halving a whole number, so the loop reaches 1 after three steps."
  },
  "arrays": {
    "title": "Build a loop from its invariant",
    "code": "// Invariant: total is the sum of positive values already visited.\nlet total = 0;\nfor (const n of [-2, 4, 0, 3]) {\n  if (n > 0) total += n;\n}",
    "reasoning": "Initialization makes the invariant true for an empty prefix. Each update preserves it because only a positive current value is added. At termination the prefix is the entire array, so the invariant gives the answer. This argument covers more than the sample.",
    "challenge": "A learner moves return total inside the loop. Find a small input that fails, and explain why the invariant is not enough at that earlier stopping point.",
    "answer": "[1, 2] returns 1 instead of 3. The invariant still describes the visited prefix, but the entire array has not been visited. Correct initialization, preservation, and termination all matter."
  },
  "text": {
    "title": "Comparison and presentation need separate values",
    "code": "const label = \" Ada \";\nconst key = label.trim().toLowerCase();\n// Compare key; return label when the task asks for original text.",
    "reasoning": "Normalization deliberately loses distinctions such as surrounding spaces and letter case. That loss is useful for comparison but may be wrong for output. Character length also depends on whether the contract means code units, code points, or visible graphemes.",
    "challenge": "For labels [\" Ada \", \"ada\"], compare case-sensitive trimmed deduplication with case-insensitive deduplication. What survives each?",
    "answer": "Trimmed case-sensitive comparison keeps Ada and ada. Case-insensitive comparison collapses them; the contract must then specify which display form survives. Normalization is a domain decision, not a universal cleanup step."
  },
  "lookup": {
    "title": "Choose what first actually means",
    "code": "const input = [8, 3, 3, 8];\n// Earliest original value that eventually repeats: 8.\n// Earliest second occurrence during a scan: 3.",
    "reasoning": "A frequency map answers how often. A seen Set answers whether a previous occurrence exists at this point. Choosing the structure follows the question. A nested search can use less explicit bookkeeping but repeat work; expected efficient lookup trades storage for time.",
    "challenge": "Trace seen before and after each visit. Then explain why adding before checking produces a false duplicate.",
    "answer": "Before visits the sets are {}, {8}, {8,3}, then the scan stops on 3. Inserting first guarantees that has(current) is true even on a new value. The order of operations encodes the invariant."
  },
  "stacks": {
    "title": "Why counts lose nested order",
    "code": "// ([)] has two openings and two closings.\n// Stack before ): [\"(\", \"[\"].\n// ) cannot close the top [.",
    "reasoning": "A count records quantity but discards opening type and order. A stack retains exactly the unmatched openings in nesting order. For reduction tasks, the same structure can instead represent a fully reduced prefix; popping exposes newly adjacent work.",
    "challenge": "Trace abba through adjacent-pair removal. Explain why merely removing bb once is incomplete.",
    "answer": "The stack evolves a, ab, a, empty. Removing bb exposes aa, which must also disappear. Each character is pushed or removes a top character, so a single scan handles cascades."
  },
  "validation": {
    "title": "Reject before normalizing",
    "code": "// Input: { page: \"2\", size: 3 }\n// A type assertion changes no runtime value.\n// Number(page) changes the acceptance policy.",
    "reasoning": "Shape guards must precede field access because null and arrays are not valid request objects here. Type checks precede value checks. Normalization is allowed only after the contract establishes which raw inputs are acceptable; coercion may hide caller errors.",
    "challenge": "Design cases separating integer validation from coercion and clamping. Include null and an exact upper bound.",
    "answer": "Test a numeric string, a fractional number, one value above the maximum, the maximum itself, and null. Under a reject-only integer contract only the valid integer at the bound passes. A clamp or coercion policy would produce different outcomes."
  },
  "frontend": {
    "title": "Make state precedence observable",
    "code": "// loading=true, error=\"failed\", items=[] => loading\n// loading=false, error=\"failed\", items=[] => error\n// loading=false, error=\"\", items=[] => empty",
    "reasoning": "Ordered branches ensure one visible state. Independent booleans can coexist, so checking count first can show an empty message before the request resolves. Derived filtering should preserve source labels and distinguish an empty dataset from zero query matches where the UI contract requires it.",
    "challenge": "Define refreshing with previous data. Should the screen clear the data? What happens if refresh fails?",
    "answer": "There is no universal answer: state the product contract. One useful policy keeps prior data visible, shows a refresh indicator, and reports refresh failure alongside it. That needs richer state than treating every pending request as an initial load."
  },
  "debugging": {
    "title": "Use a case that separates hypotheses",
    "code": "// Bug report: cart totals are too small.\n// One available item: price=100, quantity=2, discount=0.\n// Expected: 200. Draft returns: 100.",
    "reasoning": "The case isolates quantity multiplication by removing discount and unavailable-item effects. A mixed case may let defects cancel out. After finding the cause, keep this regression and add separate cases for other rules. During a refactor, keep behavior fixed and assess structural clarity separately.",
    "challenge": "Why does one active and one inactive item fail to expose a reversed active-count condition? Provide a better test.",
    "answer": "Both conditions count one in the mixed case. A single active item should count one, but the reversed condition counts zero. Small distinguishing examples provide stronger causal evidence than large realistic inputs alone."
  },
  "complexity": {
    "title": "Count work and identify what grows",
    "code": "// Two consecutive n-item loops: n + n visits.\n// A loop with a full n-item search inside: n * n visits.\n// Processing labels also visits their text.",
    "reasoning": "Consecutive scans are still linear; nested full scans are quadratic. Let m be total text processed when lengths vary, rather than pretending every string operation is constant. Distinguish output storage from auxiliary storage, and state average or expected lookup assumptions. A faster asymptotic method can still cost more for tiny inputs.",
    "challenge": "Compare a loop count with filter(...).length, and a frequency map with repeated counting. Name time and storage separately.",
    "answer": "Loop counting and filtering both visit n values, but the loop uses constant working storage while filtering stores up to n matches. A map count uses expected O(n) time and O(k) storage; repeated full counts can take O(n squared) time. Readability and workload still affect the choice."
  },
  "async": {
    "title": "Trace an out-of-order response",
    "code": "// Start request A for query \"a\".\n// Start request B for query \"ada\".\n// B finishes, then A finishes.\n// Apply only the response owning the current query.",
    "reasoning": "Completion order differs from start order. A request generation or identity check can prevent A from replacing B. AbortController can reduce obsolete work for supported operations, but cleanup and ownership checks still matter. Promise.all groups independent operations; it does not solve races between successive user intents.",
    "challenge": "If A fails after B succeeds, should its catch set the current error? Explain what cleanup must check.",
    "answer": "An obsolete request must not own current success, error, or loading state. Guard catch and finally as well as the success branch. Otherwise an old failure or cleanup can overwrite a newer valid result or hide its loading indicator."
  },
  "http": {
    "title": "Count the filtered collection before paging",
    "code": "// Source statuses: [closed, open, open, open].\n// Filter open => 3 matches.\n// Page 2, size 2 => final match, total 3.",
    "reasoning": "Page is one-based here; offset is (page - 1) times size. Validation defaults, upper limits, error shape, and precedence must be explicit. The in-memory rep models parsed requests; raw URL parsing and live HTTP transport require separate checks. Stable ordering needs a unique tie-breaker when the data source has no intrinsic order.",
    "challenge": "Show how paging before filtering changes the result for the source above. Then name a deterministic database ordering.",
    "answer": "Paging the original collection first selects positions 2 and 3, yielding two open records instead of one. An order such as created_at plus unique id gives a deterministic tie-breaker; concurrent changes still require a consistency policy."
  },
  "react": {
    "title": "Derive output and clean up external work",
    "code": "const [query, setQuery] = useState(\"\");\nconst visible = items.filter(item => item.name.includes(query));\n// An interval effect should return () => clearInterval(id).",
    "reasoning": "items and query determine visible, so separate visible state adds a second copy that must stay synchronized. Rendering should calculate output without starting external work. Effects manage subscriptions, timers, or requests and must undo their work on replacement or unmount. Functional updates are useful when the next value depends on the previous one.",
    "challenge": "Two queued handlers each call setCount(count + 1) from the same captured count. Contrast that with two setCount(n => n + 1) calls.",
    "answer": "Both direct updates calculate the same next value from the captured count, so they do not necessarily produce two increments. Functional updates compose using the pending previous value and produce two increments. Closure capture and cleanup are separate concerns."
  },
  "testing": {
    "title": "Find a counterexample before broad coverage",
    "code": "// Contract: values strictly greater than 5 count.\n// Candidate uses >=.\n// Input [5] distinguishes the two behaviors.",
    "reasoning": "A counterexample is an input on which the claimed behavior is wrong. Derive expected output from the requirement, not by copying candidate logic. After a repair, retain the regression and cover other boundaries. Output correctness does not establish nonmutation, accessibility, reasoning quality, or every possible input unless those are separately assessed.",
    "challenge": "A mutation bug returns the correct sorted titles but reorders the source array. What must the test observe?",
    "answer": "Capture source order before the call and compare it afterward as well as checking returned titles. This observes the preservation contract. It does not prove the source was never temporarily changed and restored, nor does it evaluate the learner's explanation."
  },
  "databases": {
    "title": "Stable ordering and atomicity solve different problems",
    "code": "// ORDER BY created_at, id defines ties.\n// BEGIN; write profile; write attempts; COMMIT;\n// Roll back both writes when either fails.",
    "reasoning": "A primary key establishes identity; a deterministic order establishes sequence. A transaction makes related writes commit together. Neither automatically makes offset pagination stable across concurrent inserts. Indexes trade storage and write cost for query access, and parameterized values remain separate from SQL syntax.",
    "challenge": "A new row appears between fetching pages 1 and 2. Can ORDER BY alone prevent a repeated or skipped row? Propose a policy.",
    "answer": "No. Offset positions can shift even under deterministic ordering. A consistent snapshot or a suitable cursor policy can help, depending on the desired semantics and data changes. The function-runner reps do not execute a database, so this reasoning is self-reviewed rather than integration-tested."
  }
}

