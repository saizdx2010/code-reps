import { connectedFeatureDepth } from './review-connected-feature.ts'
import { testingJourneyDepth } from './review-testing-journey.ts'
import { browserStateDepth } from './review-browser-state.ts'
import { dsaDepth } from './review-dsa.ts'
import { practicalRepDepth } from './review-practical.ts'
import { validationDepth } from './review-validation.ts'
import { appDepth } from './review-app.ts'
import { dsaAdvancedDepth } from './review-dsa-advanced.ts'
import { domDepth } from './review-dom.ts'
export type TraceStructure =
  | { kind: 'array'; values: (string | number)[]; pointers?: Record<string, number>; dimmed?: number[] }
  | { kind: 'stack'; values: (string | number)[] }
  | { kind: 'map'; entries: [string, string | number][] }
  | { kind: 'tree'; root: TraceTreeNode; current?: string; visited?: string[] }
  | { kind: 'calls'; frames: TraceFrame[]; event?: 'call' | 'return' }
  | { kind: 'table'; cells: (string | number | null)[][]; name?: string; rowLabels?: string[]; colLabels?: string[]; current?: [number, number]; reads?: [number, number][] }
  | { kind: 'state'; entries: [string, string | number | boolean | null][]; events?: string[]; eventIndex?: number }
// Table cells run row by row; null marks a cell that is not filled yet. Indices are [row, column].
export type TraceTreeNode = { id: string; value: string | number; note?: string; children?: TraceTreeNode[] }
// Frames run bottom to top; only the top frame may carry a return value.
export type TraceFrame = { call: string; locals?: string; returns?: string | number | boolean }
export type TraceStep = { line: number; vars: Record<string, string | number | boolean | null>; structure?: TraceStructure; note: string }
export type RepTrace = { code: string[]; input: string; steps: TraceStep[] }

export type RepDepth = { reasoning: string; trace: string; traceSteps?: RepTrace; alternative: string; counterexample: string; transfer: string }

// Authored post-attempt reviews. Keep these out of independent task prompts.
export const repDepth: Record<string, RepDepth> = {
  ...connectedFeatureDepth,
  ...testingJourneyDepth,
  ...practicalRepDepth,
  ...dsaDepth,
  ...dsaAdvancedDepth,
  ...validationDepth,
  ...appDepth,
  ...domDepth,
  ...browserStateDepth,
  "declare-variables": {
    "reasoning": "A name and its value are different: const protects the binding, not every value reachable through it.",
    "trace": "With name Ada, greeting remains Hello plus a space; message becomes Hello, Ada. With an empty name the space remains.",
    "alternative": "Returning the concatenation directly is shorter but does not practice the requested declarations. let is justified when reassignment is needed, not merely because a value is calculated.",
    "counterexample": "Removing the trailing space produces HelloAda. Output checks still cannot prove which declarations you used.",
    "transfer": "Change the task to build a message in two assignments. Which binding now needs let?"
  },
  "basic-types": {
    "reasoning": "Formatting must preserve the values supplied, including falsy values.",
    "trace": "For Bo, 0, false the sentence is Bo is 0. Active: false. Neither 0 nor false disappears.",
    "alternative": "Concatenation and template strings can both work; template strings make the punctuation easier to inspect. Neither validates unknown runtime data.",
    "counterexample": "Using age || 18 replaces a legitimate zero. Explain why a default would change the contract.",
    "transfer": "Add an optional nickname with a documented missing-value rule. Distinguish absent text from an empty string."
  },
  "create-objects": {
    "reasoning": "An object gives related properties one identity and a documented shape.",
    "trace": "Create {name: Ada, age: 28}, read person.name and person.age, then form Ada is 28 years old.",
    "alternative": "Using parameters directly gives the same sentence but bypasses the object-learning goal. A type documents shape without validating network input.",
    "counterexample": "A correct sentence alone does not prove an object was created. Inspect the code as well as the result.",
    "transfer": "Add a city property and explain which type and construction sites must change."
  },
  "make-arrays": {
    "reasoning": "Absence of an item differs from an item containing empty text.",
    "trace": "[] has length zero and returns null; [empty string, Ada] has an item at zero and returns that empty string.",
    "alternative": "names[0] ?? null can express absence compactly under this contract. An explicit length check makes the empty-array rule visible.",
    "counterexample": "names[0] || null incorrectly turns an empty first name into null.",
    "transfer": "Return the last item instead. Explain how the empty case changes the index calculation."
  },
  "write-functions": {
    "reasoning": "Returning transfers a computed value to a caller that can use it again.",
    "trace": "price 2.5 and quantity 2 produce 5; quantity zero produces zero without a special branch.",
    "alternative": "Printing the product helps inspection but is not a replacement for return. Extra state is unnecessary for one expression.",
    "counterexample": "Hardcoding 15 passes the example but fails price 2.5 and quantity 2.",
    "transfer": "Use the returned total in a second calculation and explain why console.log cannot supply that value."
  },
  "pass-or-retry": {
    "reasoning": "One comparison splits every score into two groups. Using >= puts the edge value 50 in the passing group, and the final return covers everything else.",
    "trace": "For 50, 50 >= 50 is true, so the result is Pass. For 49, 49 >= 50 is false, so the if block is skipped and the final return gives Retry.",
    "alternative": "An if with else makes both branches visible, while an early return needs no else. A conditional expression is shorter but harder to read while you are learning the boundary.",
    "counterexample": "Writing score > 50 sends exactly 50 to Retry. The edge check at 50 exposes it, and the example 72 would not.",
    "transfer": "Change the rule so a score must be above 50 to pass, then name which check changes and what 50 returns."
  },
  "use-conditions": {
    "traceSteps": {"code": ["function gradeLabel(score: number): string {", "  if (score < 0 || score > 100) return 'Invalid'", "  if (score >= 90) return 'A'", "  if (score >= 80) return 'B'", "  if (score >= 70) return 'C'", "  if (score >= 60) return 'D'", "  return 'F'", "}"], "input": "score = 60", "steps": [
      {"line": 0, "vars": {}, "structure": {"kind": "state", "entries": [["score", 60], ["rules that did not match", "none"], ["grade", "not chosen"]]}, "note": "The score is 60. Check the invalid range first."},
      {"line": 1, "vars": {}, "structure": {"kind": "state", "entries": [["score", 60], ["rules that did not match", "none"], ["grade", "not chosen"]]}, "note": "Is 60 below 0 or above 100? No, so the invalid rule does not match."},
      {"line": 2, "vars": {}, "structure": {"kind": "state", "entries": [["score", 60], ["rules that did not match", "invalid range"], ["grade", "not chosen"]]}, "note": "60 is not 90 or more, so the A rule does not match."},
      {"line": 3, "vars": {}, "structure": {"kind": "state", "entries": [["score", 60], ["rules that did not match", "invalid range, A"], ["grade", "not chosen"]]}, "note": "60 is not 80 or more, so the B rule does not match."},
      {"line": 4, "vars": {}, "structure": {"kind": "state", "entries": [["score", 60], ["rules that did not match", "invalid range, A, B"], ["grade", "not chosen"]]}, "note": "60 is not 70 or more, so the C rule does not match."},
      {"line": 5, "vars": {"result": "D"}, "structure": {"kind": "state", "entries": [["score", 60], ["rules that did not match", "invalid range, A, B, C"], ["grade", "D"]]}, "note": "60 is at least 60, so the grade is D. The lower edge belongs to D."}
    ]},
    "reasoning": "Checking the invalid range first keeps out-of-range scores away from the grade bands. Each grade test assumes every higher band has already failed, so the order defines the boundaries.",
    "trace": "For 90, the 90 test passes first and returns A. For 89.9 that test fails, the 80 test fails, the 70 test fails, the 60 test passes, and the result is B only if 89.9 is at least 80. For 101 the range guard returns Invalid before any grade test runs.",
    "alternative": "A table of score ranges is compact, but each inclusive or exclusive edge must be written correctly. Separate if statements make each boundary visible when you trace a value.",
    "counterexample": "Writing score > 90 for A sends exactly 90 to B, which breaks the contract. The boundary value is where this mistake appears.",
    "transfer": "Add a plus band for 97 and above, and explain which branch must come first and what 96.5 returns."
  },
  "loop-with-for": {
    "traceSteps": {"code": ["function sumUpTo(n: number): number {", "  let total = 0", "  for (let i = 1; i <= n; i++) {", "    total += i", "  }", "  return total", "}"], "input": "n = 4", "steps": [
      {"line": 1, "vars": {"n": 4}, "note": "n is 4, so the loop counts from 1 up to 4. If n were 0, the loop would never run and the result would be 0."},
      {"line": 2, "vars": {"n": 4, "total": 0, "i": 1}, "note": "i starts at 1. Since 1 is at most 4, the loop body runs."},
      {"line": 3, "vars": {"n": 4, "total": 0, "i": 1}, "note": "Add 1: the total goes from 0 to 1."},
      {"line": 2, "vars": {"n": 4, "total": 1, "i": 2}, "note": "i is now 2. It is still at most 4, so the body runs again."},
      {"line": 3, "vars": {"n": 4, "total": 1, "i": 2}, "note": "Add 2: the total goes from 1 to 3."},
      {"line": 3, "vars": {"n": 4, "total": 3, "i": 3}, "note": "i is now 3. Add 3: the total goes from 3 to 6."},
      {"line": 3, "vars": {"n": 4, "total": 6, "i": 4}, "note": "i is now 4. Add 4: the total goes from 6 to 10."},
      {"line": 2, "vars": {"n": 4, "total": 10, "i": 5}, "note": "i is 5, which is more than 4, so the loop stops."},
      {"line": 5, "vars": {"n": 4, "total": 10, "result": 10}, "note": "Return the total, 10."}
    ]},
    "reasoning": "The total is the sum of the values already visited. It starts at zero, so the empty range is correct, and each pass adds the next value until i passes n.",
    "trace": "For n = 4 the total becomes 1, 3, 6, and 10 as i takes 1, 2, 3, and 4. For n = 0 the condition 1 <= 0 is false, so the loop never runs and 0 is returned.",
    "alternative": "The formula n * (n + 1) / 2 returns the same result without visiting each value. The loop is easier to change when the rule adds only selected values.",
    "counterexample": "Using i < n omits n. For n = 4 it returns 6 instead of 10.",
    "transfer": "Sum only the odd numbers from 1 through n. Decide the starting value and the step size before you write the loop body."
  },
  "loop-while": {
    "traceSteps": {"code": ["function stepsToOne(n: number): number {", "  let value = n", "  let steps = 0", "  while (value > 1) {", "    value = Math.floor(value / 2)", "    steps++", "  }", "  return steps", "}"], "input": "n = 9", "steps": [
      {"line": 1, "vars": {"n": 9}, "note": "The starting number is 9. No halving has happened yet."},
      {"line": 3, "vars": {"value": 9, "steps": 0}, "note": "9 is more than 1, so the loop body runs."},
      {"line": 5, "vars": {"value": 4, "steps": 0}, "note": "9 halved and rounded down is 4. Count this step: steps goes from 0 to 1."},
      {"line": 3, "vars": {"value": 4, "steps": 1}, "note": "4 is more than 1, so the loop runs again."},
      {"line": 5, "vars": {"value": 2, "steps": 1}, "note": "4 halved is 2. Count this step: steps goes from 1 to 2."},
      {"line": 3, "vars": {"value": 2, "steps": 2}, "note": "2 is more than 1, so one more halving is needed."},
      {"line": 5, "vars": {"value": 1, "steps": 2}, "note": "2 halved is 1. Count this step: steps goes from 2 to 3."},
      {"line": 3, "vars": {"value": 1, "steps": 3}, "note": "1 is not more than 1, so the loop stops."},
      {"line": 7, "vars": {"value": 1, "steps": 3, "result": 3}, "note": "Return the step count, 3."}
    ]},
    "reasoning": "The loop tests the current value before each halving. When the value reaches 1 no further halving is needed, so the count equals the number of halvings performed.",
    "trace": "Starting with 9, the value is greater than 1, so it becomes 4 and steps becomes 1. Then 4 becomes 2 and steps becomes 2. Then 2 becomes 1 and steps becomes 3. The value 1 fails the condition, so the result is 3.",
    "alternative": "A for loop with a manual break can work, but the while condition states the stopping rule directly. Bit operations count bit length, but they hide the halving rule this rep asks you to practice.",
    "counterexample": "Using value / 2 without Math.floor gives 9 four steps: 4.5, 2.25, 1.125, and 0.5625. The value stays fractional, so the count is wrong.",
    "transfer": "Repeat the halving rule until the value is 0 instead. Explain why an input of 1 never reaches 0 under floor division, and what this means for the loop."
  },
  "string-basics": {
    "reasoning": "Trimming removes display padding before words are split. Each initial comes from the first character of an actual word, so the empty name gives an empty result rather than a special error.",
    "trace": "For '  grace   hopper ', trim gives 'grace   hopper'. Splitting on whitespace runs gives grace and hopper, so the first letters give GH. For an empty name the split result is one empty word, and slice(0, 1) gives an empty string.",
    "alternative": "A regular expression that matches word starts can extract initials in one step. Splitting is easier to trace, but it still needs a rule for repeated separators.",
    "counterexample": "Splitting '  grace   hopper' on single spaces creates empty words. Calling word[0].toUpperCase() on an empty word throws an error. slice(0, 1) returns an empty string for those words instead.",
    "transfer": "Return the first letter of the first and last words only. Decide what a one-word name should return before you change the code."
  },
  "object-update": {
    "traceSteps": {"code": ["type Task = { title: string; done: boolean; priority: number }", "function setDone(task: Task, done: boolean): Task {", "  const before = task.done", "  const copy: Task = { ...task }", "  copy.done = done", "  const changed = before !== done", "  return copy", "}"], "input": "task = { title: 'Write', done: false, priority: 2 }, done = true", "steps": [
      {"line": 1, "vars": {}, "structure": {"kind": "state", "entries": [["original done", false], ["copy done", "not made"]]}, "note": "The function receives the task and the requested done value. The task must stay unchanged."},
      {"line": 2, "vars": {}, "structure": {"kind": "state", "entries": [["original done", false], ["copy done", "not made"]]}, "note": "Save the original done flag, false, so it can be compared later."},
      {"line": 3, "vars": {"before": false}, "structure": {"kind": "state", "entries": [["original done", false], ["copy done", "not made"]]}, "note": "Make a new object with the same title, done flag, and priority."},
      {"line": 4, "vars": {"before": false}, "structure": {"kind": "state", "entries": [["original done", false], ["copy done", false]]}, "note": "The copy starts with done false. Next, set done on the copy only."},
      {"line": 5, "vars": {"before": false}, "structure": {"kind": "state", "entries": [["original done", false], ["copy done", true]]}, "note": "Only the copy now has true. The original still has false."},
      {"line": 6, "vars": {"before": false, "changed": true, "result": "{\"title\": \"Write\", \"done\": true, \"priority\": 2}"}, "structure": {"kind": "state", "entries": [["original done", false], ["copy done", true]]}, "note": "The flag changed, so changed is true. Return the new copy."}
    ]},
    "reasoning": "The caller keeps its original task. Returning a new object makes the change explicit, and code that still holds the old value sees no surprise.",
    "trace": "For { title: 'Write', done: false, priority: 2 } with done true, the spread copies title and priority, then done replaces false. The supplied object still has done false afterward.",
    "alternative": "Object.assign({}, task, { done }) gives the same result and is more verbose. Assigning task.done directly is shorter but changes the caller's object.",
    "counterexample": "task.done = done; return task can return the right value. It fails because the supplied object changed, which the input check detects.",
    "transfer": "Update one field inside a nested settings object. Explain why one spread is no longer enough and which nested objects must be copied."
  },
  "verify-generated-code": {
    "reasoning": "A proposed implementation is a claim to verify against the contract.",
    "trace": "For [blank, Ada with spaces], the first trim is empty so continue; the next trim is Ada so return it. Only blanks produce null.",
    "alternative": "Trimming all labels and finding a match is readable but creates an intermediate array; a loop can stop once a useful label is found.",
    "counterexample": "Returning labels[0].trim() produces empty text for a blank first label even when a later useful label exists.",
    "transfer": "Write a new failing case before looking at another suggested implementation. Explain the expected output independently."
  },
  "frontend-visible-items": {
    "reasoning": "Comparison text and display text have different responsibilities.",
    "trace": "With query ADA surrounded by spaces, normalize to ada. An active label Ada with spaces matches and is returned unchanged; inactive matches are skipped.",
    "alternative": "filter then map expresses selection and projection; a loop avoids an intermediate selected array. Both process label text as well as items.",
    "counterexample": "Lowercasing the returned label passes matching logic but changes display data.",
    "transfer": "Add a second filter such as team. Explain which filters combine and whether output order changes."
  },
  "frontend-view-state": {
    "traceSteps": {"code": ["function viewState(loading: boolean, error: string | null, count: number): string {", "  const hasError = error !== null && error !== ''", "  const isEmpty = count === 0", "  if (loading) return 'loading'", "  if (hasError) return 'error'", "  if (isEmpty) return 'empty'", "  return 'ready'", "}"], "input": "loading = false, error = '', count = 0", "steps": [
      {"line": 0, "vars": {}, "structure": {"kind": "state", "entries": [["loading", false], ["error", "\"\""], ["count", 0], ["hasError", "not set"], ["isEmpty", "not set"]]}, "note": "The function receives loading, error text, and count. The checks run from top to bottom."},
      {"line": 1, "vars": {}, "structure": {"kind": "state", "entries": [["loading", false], ["error", "\"\""], ["count", 0], ["hasError", "not set"], ["isEmpty", "not set"]]}, "note": "Empty error text is not an error, so hasError will be false."},
      {"line": 2, "vars": {}, "structure": {"kind": "state", "entries": [["loading", false], ["error", "\"\""], ["count", 0], ["hasError", false], ["isEmpty", "not set"]]}, "note": "hasError is false. Count is 0, so isEmpty will be true."},
      {"line": 3, "vars": {}, "structure": {"kind": "state", "entries": [["loading", false], ["error", "\"\""], ["count", 0], ["hasError", false], ["isEmpty", true]]}, "note": "Loading is false, so the loading rule does not match."},
      {"line": 4, "vars": {}, "structure": {"kind": "state", "entries": [["loading", false], ["error", "\"\""], ["count", 0], ["hasError", false], ["isEmpty", true]]}, "note": "hasError is false, so the error rule does not match."},
      {"line": 5, "vars": {"result": "empty"}, "structure": {"kind": "state", "entries": [["loading", false], ["error", "\"\""], ["count", 0], ["hasError", false], ["isEmpty", true]]}, "note": "isEmpty is true, so the screen shows the empty state. The ready state is never reached."}
    ]},
    "reasoning": "State precedence prevents contradictory inputs from producing misleading UI.",
    "trace": "With loading true, an error and count zero still yield loading. When loading ends, a nonempty error wins; an empty error allows empty or ready.",
    "alternative": "Ordered guards express precedence clearly; independent assignments can accidentally overwrite a higher-priority state.",
    "counterexample": "Checking count first shows empty while a request is still loading.",
    "transfer": "Add a refreshing state that preserves previous data. Define its relationship with loading and errors before coding."
  },
  "backend-validate-user": {
    "reasoning": "Validate unknown shape before accessing fields, then construct trusted output.",
    "trace": "null fails the shape check. {name: spaces around Ada, age: 0} becomes {name: Ada, age: 0}; age 120 is valid and 121 is not.",
    "alternative": "A runtime schema can centralize validation in a larger service; explicit guards keep this small contract visible. A type assertion provides no runtime check.",
    "counterexample": "Number(age) accepts a numeric string that this contract forbids. Arrays are objects but are not valid requests.",
    "transfer": "Add a required boolean field. Test missing, false, and a string containing false separately."
  },
  "backend-page-results": {
    "reasoning": "Normalize the paging inputs before using them in both slice boundaries.",
    "trace": "For IDs [a,b,c,d], page 2 and size 9 normalize size to 3, giving offset 3 and result [d].",
    "alternative": "slice copies only the requested page and preserves input; filtering by index scans every ID. This rep intentionally clamps rather than rejects.",
    "counterexample": "Using the original size for offset and the clamped size for length produces gaps.",
    "transfer": "Change the contract to reject invalid paging inputs. Identify which existing behavior must change."
  },
  "interview-frontend": {
    "reasoning": "Selection, ordering, and projection are separate requirements.",
    "trace": "Drop completed tasks; among priorities [2,5,5], return the two priority-5 titles in their original relative order, then priority 2.",
    "alternative": "Sorting a filtered copy is simple. Maintaining an ordered structure may help repeated updates but adds complexity; measure workload before choosing it.",
    "counterexample": "Sorting the source array changes caller-owned order. A comparator that breaks ties alphabetically violates stable ties.",
    "transfer": "Add a top-k limit. Compare full sorting with selecting only the highest k and state the tie rule."
  },
  "interview-backend": {
    "reasoning": "Validation establishes the small promised shape; normalization must not silently widen it.",
    "trace": "Trim ADA@EXAMPLE, confirm one @ and nonblank sides, then lowercase. a@@b and a@blank fail; role admin fails.",
    "alternative": "Splitting on @ is explicit for this contract. A full email validator solves a broader problem and may reject inputs this exercise permits.",
    "counterexample": "Accepting any text containing @ wrongly accepts a@@b. The stated contract still allows internal spaces.",
    "transfer": "Propose stricter email rules as a separate contract revision, with newly accepted and rejected examples."
  },
  "most-frequent-number": {
    "reasoning": "A winner depends on final frequency and an explicit tie rule, not first appearance.",
    "trace": "For [9,2,9,2], counts finish at 9:2 and 2:2; choose 2 because it is smaller. Empty input has no winner.",
    "alternative": "Count then select separates responsibilities. Online best tracking can also work if every update handles ties; repeated counting scans can become quadratic.",
    "counterexample": "Keeping the first maximum gives 9 on the tie case. Using zero as an empty sentinel confuses a valid winning zero.",
    "transfer": "Change ties to earliest original occurrence. Explain which extra information must be retained."
  },
  "first-unique-character": {
    "reasoning": "Uniqueness requires knowledge of later occurrences, while first requires original order.",
    "trace": "In swiss, s occurs three times, w once and i once. Scan from index zero: s fails, w succeeds at index 1.",
    "alternative": "A frequency map plus a second scan is expected linear time. Comparing first and last positions is compact but repeated searches can be quadratic.",
    "counterexample": "Returning the first character not yet seen accepts s before discovering its later repetitions.",
    "transfer": "Return every unique character in original order. Keep the basic Latin assumption explicit."
  },
  "balanced-brackets": {
    "reasoning": "Nested structure must close the latest unmatched opening first.",
    "trace": "For ([)], push (, push [, then ) expects ( but the top is [. Reject before reaching the final ].",
    "traceSteps": {
      "code": [
        "function isBalanced(text: string): boolean {",
        "  const stack: string[] = []",
        "  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }",
        "  for (const character of text) {",
        "    if (character === '(' || character === '[' || character === '{') stack.push(character)",
        "    else if (stack.pop() !== pairs[character]) return false",
        "  }",
        "  return stack.length === 0",
        "}"
      ],
      "input": "text = '([)]'",
      "steps": [
        { "line": 1, "vars": { "text": "([)]" }, "structure": { "kind": "stack", "values": [] }, "note": "Start with an empty stack for opening brackets that are still waiting for a closing bracket." },
        { "line": 3, "vars": { "character": "(" }, "structure": { "kind": "stack", "values": [] }, "note": "Read the first character, an opening bracket." },
        { "line": 4, "vars": { "character": "(" }, "structure": { "kind": "stack", "values": ["("] }, "note": "Save the opening bracket on the stack." },
        { "line": 3, "vars": { "character": "[" }, "structure": { "kind": "stack", "values": ["("] }, "note": "Read the next character, another opening bracket." },
        { "line": 4, "vars": { "character": "[" }, "structure": { "kind": "stack", "values": ["(", "["] }, "note": "The newer [ sits on top, so it must be closed before the (." },
        { "line": 3, "vars": { "character": ")" }, "structure": { "kind": "stack", "values": ["(", "["] }, "note": "Read ). It must match the most recent unmatched opening bracket." },
        { "line": 5, "vars": { "character": ")" }, "structure": { "kind": "stack", "values": ["("] }, "note": "Removing [ leaves ( on the stack. ) needs (, so the two do not match and the function rejects here." },
        { "line": 5, "vars": { "character": ")", "result": false }, "structure": { "kind": "stack", "values": ["("] }, "note": "The function returns false before reading the final ]. Both bracket types appear twice, but the order is wrong." }
      ]
    },
    "alternative": "A stack handles several bracket types. A single counter suffices for one type but loses the opening type and nesting order here.",
    "counterexample": "([)] has matching counts for each type but is not balanced.",
    "transfer": "Allow non-bracket text to be ignored. State that new rule and test a mixed-text expression."
  },
  "sum-positive-numbers": {
    "traceSteps": {"code": ["function sumPositive(numbers: number[]): number {", "  let sum = 0", "  for (let i = 0; i < numbers.length; i++) {", "    if (numbers[i] > 0) sum += numbers[i]", "  }", "  return sum", "}"], "input": "numbers = [-2, 3, 0, 5]", "steps": [
      {"line": 2, "vars": {"sum": 0}, "structure": {"kind": "array", "values": [-2, 3, 0, 5]}, "note": "The total starts at 0. No position has been checked yet."},
      {"line": 3, "vars": {"sum": 0, "i": 0}, "structure": {"kind": "array", "values": [-2, 3, 0, 5], "pointers": {"i": 0}}, "note": "Index 0 holds -2. It is not above 0, so the total stays 0."},
      {"line": 3, "vars": {"sum": 0, "i": 1}, "structure": {"kind": "array", "values": [-2, 3, 0, 5], "pointers": {"i": 1}, "dimmed": [0]}, "note": "Index 1 holds 3. It is above 0, so 3 will be added to the total."},
      {"line": 3, "vars": {"sum": 3, "i": 2}, "structure": {"kind": "array", "values": [-2, 3, 0, 5], "pointers": {"i": 2}, "dimmed": [0, 1]}, "note": "Index 2 holds 0. Zero is not above 0, so the total stays 3."},
      {"line": 3, "vars": {"sum": 3, "i": 3}, "structure": {"kind": "array", "values": [-2, 3, 0, 5], "pointers": {"i": 3}, "dimmed": [0, 1, 2]}, "note": "Index 3 holds 5. It is above 0, so 5 will be added to the total."},
      {"line": 5, "vars": {"sum": 8, "result": 8}, "structure": {"kind": "array", "values": [-2, 3, 0, 5], "dimmed": [0, 1, 2, 3]}, "note": "Every index has been checked. Return the total, 8."}
    ]},
    "reasoning": "After each visit, total equals the sum of positive values in the visited prefix.",
    "trace": "For [-2,4,0,3], totals are 0,4,4,7. Empty input leaves the initial zero untouched.",
    "alternative": "A loop keeps only a total; filter then reduce creates a selected array. A reducer without an initial value fails on empty input.",
    "counterexample": "Returning after the first positive produces 4 instead of 7.",
    "transfer": "Sum prices only when a record is available. Explain how the invariant changes from numbers to records."
  },
  "count-even-numbers": {
    "reasoning": "Count qualifying values rather than accumulating their magnitude.",
    "trace": "For [0,-2,3,4], counts become 1,2,2,3. A negative even number still has remainder zero.",
    "alternative": "A loop uses constant working memory; filtering and reading length builds an array. Both inspect every input.",
    "counterexample": "Checking n % 2 === 1 for oddness fails for negative odd numbers; checking remainder zero for evenness avoids that trap.",
    "transfer": "Count numbers divisible by a supplied nonzero divisor. Define the zero-divisor contract first."
  },
  "count-above-threshold": {
    "reasoning": "Strict comparison excludes equality, and the count summarizes every visited value.",
    "trace": "For [4,5,6] and limit 5, count stays 0,0 then becomes 1.",
    "alternative": "A loop avoids allocating selected values; filter is concise when the selected values are also needed.",
    "counterexample": "Using >= yields 2 instead of 1 at the equality boundary.",
    "transfer": "Count values within a range. Specify whether both endpoints are included before choosing operators."
  },
  "first-long-word": {
    "reasoning": "First-match search may stop early because later items cannot change the earliest result.",
    "trace": "For [a,code,longer] and minimum 4, a fails, code qualifies and longer is never needed.",
    "alternative": "find is concise but its absent result is undefined, so adapt it to null. Filtering all words does unnecessary work for a first-match task.",
    "counterexample": "Using > skips code at the exact length boundary. A zero minimum allows an empty first word.",
    "transfer": "Search records for the first available item at a price limit. Explain the stopping condition."
  },
  "count-words": {
    "traceSteps": {"code": ["function countWords(text: string): number {", "  let count = 0", "  let inWord = false", "  for (let i = 0; i < text.length; i++) {", "    if (/\\s/.test(text[i])) inWord = false", "    else if (!inWord) { inWord = true; count++ }", "  }", "  return count", "}"], "input": "text = ' ab  c '", "steps": [
      {"line": 3, "vars": {"count": 0, "inWord": false}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"]}, "note": "Each box is one character, and ␣ stands for a space. Start with zero words and no word open."},
      {"line": 4, "vars": {"count": 0, "inWord": false, "i": 0}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 0}}, "note": "The first character is a space. A space before a word does not start a word."},
      {"line": 5, "vars": {"count": 0, "inWord": false, "i": 1}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 1}, "dimmed": [0]}, "note": "a is not a space and no word is open, so a new word starts. Count will go from 0 to 1."},
      {"line": 4, "vars": {"count": 1, "inWord": true, "i": 2}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 2}, "dimmed": [0, 1]}, "note": "b is not a space and a word is already open, so count stays at 1."},
      {"line": 4, "vars": {"count": 1, "inWord": true, "i": 3}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 3}, "dimmed": [0, 1, 2]}, "note": "This space ends the word, so inWord becomes false."},
      {"line": 4, "vars": {"count": 1, "inWord": false, "i": 4}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 4}, "dimmed": [0, 1, 2, 3]}, "note": "Another space. Repeated spaces do not add words."},
      {"line": 5, "vars": {"count": 1, "inWord": false, "i": 5}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 5}, "dimmed": [0, 1, 2, 3, 4]}, "note": "c starts a second word. Count will go from 1 to 2."},
      {"line": 4, "vars": {"count": 2, "inWord": true, "i": 6}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "pointers": {"i": 6}, "dimmed": [0, 1, 2, 3, 4, 5]}, "note": "The trailing space ends the second word. Count stays at 2."},
      {"line": 7, "vars": {"count": 2, "inWord": false, "result": 2}, "structure": {"kind": "array", "values": ["␣", "a", "b", "␣", "␣", "c", "␣"], "dimmed": [0, 1, 2, 3, 4, 5, 6]}, "note": "Every character has been checked. Return the count, 2."}
    ]},
    "reasoning": "Whitespace runs are separators, not words, and blank text needs an explicit zero result.",
    "trace": "Trim spaces around Ada followed by a tab and Bo; splitting the remaining text on whitespace yields [Ada,Bo], so return 2.",
    "alternative": "Splitting is clear but allocates words. A character scan can count transitions into words using constant working space.",
    "counterexample": "Splitting only on a single space misses tabs and can count empty pieces from repeated spaces.",
    "transfer": "Count words without allocating a word array. Describe the state needed while scanning."
  },
  "has-duplicate": {
    "traceSteps": {"code": ["function hasDuplicate(numbers: number[]): boolean {", "  const seen = new Map<number, number>()", "  for (let i = 0; i < numbers.length; i++) {", "    if (seen.has(numbers[i])) return true", "    seen.set(numbers[i], i)", "  }", "  return false", "}"], "input": "numbers = [4, 0, -1, 4]", "steps": [
      {"line": 1, "vars": {}, "structure": {"kind": "map", "entries": []}, "note": "Start with an empty map. Each number seen so far is stored with the index where it first appeared."},
      {"line": 3, "vars": {"i": 0}, "structure": {"kind": "map", "entries": []}, "note": "4 is not in the map, so it is not a duplicate. It is stored next."},
      {"line": 3, "vars": {"i": 1}, "structure": {"kind": "map", "entries": [["4", 0]]}, "note": "0 is not in the map yet, so it is new. It is stored with index 1."},
      {"line": 3, "vars": {"i": 2}, "structure": {"kind": "map", "entries": [["4", 0], ["0", 1]]}, "note": "-1 is new too. Negative numbers are stored the same way as any other number."},
      {"line": 3, "vars": {"i": 3}, "structure": {"kind": "map", "entries": [["4", 0], ["0", 1], ["-1", 2]]}, "note": "4 is already in the map, stored at index 0. This is a repeat, so this line returns true."},
      {"line": 3, "vars": {"i": 3, "result": true}, "structure": {"kind": "map", "entries": [["4", 0], ["0", 1], ["-1", 2]]}, "note": "The function returns true right away. Later numbers are not checked."}
    ]},
    "reasoning": "Before each visit, seen contains exactly the values in the visited prefix.",
    "trace": "For [5,2,2], save 5, save 2, then find 2 already saved and return true.",
    "alternative": "A Set uses expected efficient lookup and O(k) space; nested comparisons avoid a Set but can take quadratic time.",
    "counterexample": "Adding before testing membership makes the very first value appear duplicated.",
    "transfer": "Detect duplicates by record ID instead of object identity. Explain which key enters the Set."
  },
  "missing-number": {
    "reasoning": "The complete range is determined by length, under the guaranteed no-duplicate contract.",
    "trace": "For [3,0,1], n is 3, expected sum is 6 and actual sum is 4; missing is 2. [] gives zero.",
    "alternative": "A Set makes membership visible but uses O(n) storage. Sum subtraction uses constant storage; safe numeric range matters if the contract expands.",
    "counterexample": "Treating the maximum supplied value as n fails when n itself is missing, such as [0,1].",
    "transfer": "Now permit duplicate inputs. Explain why the sum argument no longer proves one missing value and define validation."
  },
  "valid-parentheses": {
    "reasoning": "Every prefix must have at least as many openings as closings, and the final balance must be zero.",
    "trace": "For )(, the first close makes balance negative, so reject immediately even though the final counts match.",
    "alternative": "A counter is enough for one bracket type; a stack uses more storage but generalizes to multiple types.",
    "counterexample": "Checking only final balance incorrectly accepts )(.",
    "transfer": "Extend to multiple bracket types. Explain exactly what information the counter loses."
  },
  "count-long-words": {
    "reasoning": "The running count describes all qualifying words already visited.",
    "trace": "For [a,code,longer] and minimum 4, counts are 0,1,2. Minimum zero includes even an empty word.",
    "alternative": "A loop needs constant storage; filter allocates matches. Reading basic Latin string length is not a general grapheme count.",
    "counterexample": "Using > excludes a word exactly at the minimum.",
    "transfer": "Count matching records with two conditions. Write an invariant that includes both requirements."
  },
  "first-repeated-number": {
    "reasoning": "The earliest second occurrence determines the result, not the earliest first occurrence.",
    "trace": "For [8,3,3,8], seen grows to {8,3}; the next 3 repeats before the final 8, so return 3.",
    "traceSteps": {
      "code": [
        "function firstRepeated(numbers: number[]): number | null {",
        "  const seen = new Set<number>()",
        "  for (let index = 0; index < numbers.length; index++) {",
        "    const value = numbers[index]",
        "    if (seen.has(value)) return value",
        "    seen.add(value)",
        "  }",
        "  return null",
        "}"
      ],
      "input": "numbers = [8, 3, 3, 8]",
      "steps": [
        { "line": 1, "vars": { "seen": "{}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 0 } }, "note": "Start with an empty Set and the first position." },
        { "line": 2, "vars": { "index": 0, "seen": "{}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 0 } }, "note": "Move to the first position." },
        { "line": 3, "vars": { "index": 0, "value": 8, "seen": "{}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 0 } }, "note": "The value is 8. The Set is empty, so it is not a repeat." },
        { "line": 5, "vars": { "index": 0, "value": 8, "seen": "{8}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 0 } }, "note": "Remember 8 for the positions after it." },
        { "line": 2, "vars": { "index": 1, "seen": "{8}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 1 }, "dimmed": [0] }, "note": "Move to the second position." },
        { "line": 3, "vars": { "index": 1, "value": 3, "seen": "{8}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 1 }, "dimmed": [0] }, "note": "The value is 3. It is not in the Set yet, so it is not a repeat." },
        { "line": 5, "vars": { "index": 1, "value": 3, "seen": "{8, 3}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 1 }, "dimmed": [0] }, "note": "Remember 3." },
        { "line": 2, "vars": { "index": 2, "seen": "{8, 3}" }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 2 }, "dimmed": [0, 1] }, "note": "Move to the third position." },
        { "line": 4, "vars": { "index": 2, "value": 3, "seen": "{8, 3}", "result": 3 }, "structure": { "kind": "array", "values": [8, 3, 3, 8], "pointers": { "current": 2 }, "dimmed": [0, 1] }, "note": "3 is already in the Set, so this is its second occurrence. The later 8 is never reached because the function has returned 3." }
      ]
    },
    "alternative": "A Set scan can stop immediately. Computing frequencies then taking the first duplicated value selects a different notion of first.",
    "counterexample": "The frequency-first approach returns 8 on [8,3,3,8], violating second-occurrence ordering.",
    "transfer": "Return the index of the first repeated occurrence instead of its value."
  },
  "remove-adjacent-pairs": {
    "reasoning": "The stack holds the reduced visited prefix, so its top is the only possible match for the next character.",
    "trace": "For abba, save a, save b, remove b on the next b, then remove a. The result is empty.",
    "traceSteps": {
      "code": [
        "function removePairs(text: string): string {",
        "  const stack: string[] = []",
        "  for (const character of text) {",
        "    if (stack[stack.length - 1] === character) stack.pop()",
        "    else stack.push(character)",
        "  }",
        "  return stack.join('')",
        "}"
      ],
      "input": "text = 'abba'",
      "steps": [
        { "line": 1, "vars": { "text": "abba" }, "structure": { "kind": "stack", "values": [] }, "note": "Start with an empty stack of characters that have not been removed." },
        { "line": 2, "vars": { "character": "a" }, "structure": { "kind": "stack", "values": [] }, "note": "Read the first a. Nothing is saved yet, so it cannot pair with anything." },
        { "line": 4, "vars": { "character": "a" }, "structure": { "kind": "stack", "values": ["a"] }, "note": "Save a. The stack now has one saved character." },
        { "line": 3, "vars": { "character": "b" }, "structure": { "kind": "stack", "values": ["a"] }, "note": "Compare the next b with the top, a. They differ, so b is not removed." },
        { "line": 4, "vars": { "character": "b" }, "structure": { "kind": "stack", "values": ["a", "b"] }, "note": "Save b above a." },
        { "line": 3, "vars": { "character": "b" }, "structure": { "kind": "stack", "values": ["a"] }, "note": "The second b matches the saved top b, so both are removed. a is on top again." },
        { "line": 3, "vars": { "character": "a" }, "structure": { "kind": "stack", "values": [] }, "note": "The last a matches the saved a, so that pair is removed too." },
        { "line": 6, "vars": { "result": "" }, "structure": { "kind": "stack", "values": [] }, "note": "Nothing remains, so the function returns an empty string." }
      ]
    },
    "alternative": "Repeated replacement is intuitive but can rescan the string many times; a stack processes each character once.",
    "counterexample": "One replacement pass can leave aa after removing bb from abba, even though another pair must vanish.",
    "transfer": "Explain the same process for numeric IDs, including zero and negative IDs."
  },
  "repair-visible-count": {
    "reasoning": "A minimal repair should align the condition with the contract while preserving the working scan.",
    "trace": "For one active and one inactive item, the original !active condition counts the inactive one. With both active, the original returns zero instead of two.",
    "alternative": "Replacing the whole loop with filter is possible but broadens a one-condition repair and allocates output.",
    "counterexample": "A mixed list with one of each gives count 1 before and after the fix, so that test alone hides the bug.",
    "transfer": "Choose the smallest regression case that distinguishes the reversed condition, then explain why it does."
  },
  "read-unique-names": {
    "reasoning": "The Set determines membership; the array retains first-seen output order.",
    "trace": "For [Ada,Bo,Ada], names becomes [Ada,Bo]; slice(1) returns only [Bo]. Returning names keeps both.",
    "alternative": "Returning the Set as an array could work for order, but this task asks you to preserve the loop and repair only the return.",
    "counterexample": "Trimming names changes the contract: whitespace-only names are intentionally kept here.",
    "transfer": "Compare this contract with a version that ignores trimmed blanks. Identify outputs that differ."
  },
  "transform-active-labels": {
    "reasoning": "Selection precedes normalization, and normalization precedes the blank check.",
    "trace": "An inactive Ada is skipped; active blank becomes empty and is skipped; active Bo with spaces becomes BO.",
    "alternative": "filter/map pipelines can express the stages; a loop performs them without multiple intermediate arrays.",
    "counterexample": "Checking raw length before trimming admits a whitespace-only label as an empty output string.",
    "transfer": "Return original names alongside normalized labels without changing the source objects."
  },
  "debug-cart-total": {
    "reasoning": "Repair each independent rule and keep the discount outside the per-item subtotal.",
    "trace": "An available item at 100 cents with quantity 2 and discount 30 gives 200 minus 30 = 170; an unavailable item contributes zero.",
    "alternative": "A loop or reduce can calculate the subtotal. Integer cents avoid common fractional-currency representation issues but still need a supported numeric range.",
    "counterexample": "Subtracting 30 per item applies a global discount repeatedly. A quantity-one example cannot expose the missing multiplication.",
    "transfer": "Write separate regression cases for quantity, availability, repeated discount, and zero clamping."
  },
  "frontend-directory": {
    "reasoning": "Explicit state branches and safe DOM construction protect observable behavior.",
    "trace": "Loading plus an error shows only Loading…. In loaded data, typing spaces around ADA matches original Ada text; clearing the query restores all people.",
    "alternative": "Rebuilding the list is simple for a small directory; updating only changed nodes can preserve interaction state but adds bookkeeping.",
    "counterexample": "innerHTML interprets a name containing markup. textContent preserves it as visible text. Binding Retry twice calls the callback twice.",
    "transfer": "Review keyboard navigation and retry behavior, then describe how you would prevent an obsolete request from replacing newer results."
  },
  "read-batch-labels": {
    "reasoning": "Predicting intermediate state separates understanding from merely executing supplied code.",
    "trace": "For [ Ada with spaces,Bo,Ada], trim to Ada, save it, save Bo, then skip the repeated Ada. Case variants Ada and ada remain distinct.",
    "alternative": "Writing predicted arrays makes reasoning explicit; calling collectLabels returns results without demonstrating a prediction.",
    "counterexample": "Assuming lowercase normalization merges Ada and ada, which this collector does not do.",
    "transfer": "Predict a new sequence containing blanks, spaced duplicates, and case variants before running it."
  },
  "backend-ticket-handler": {
    "reasoning": "Validation precedence and filter-before-page order are part of the response contract.",
    "trace": "An unsupported method returns 405 even with a bad query. For three matching tickets, page 2 size 2 returns the third with total 3.",
    "alternative": "Filtering then slicing is clear in memory; a database query must use equivalent predicates and deterministic order for both count and page.",
    "counterexample": "Paging first can omit matches on later positions and makes total describe the wrong collection.",
    "transfer": "Describe how to keep count and page consistent if data changes between two database queries."
  },
  "refactor-stock-summary": {
    "reasoning": "Behavioral equivalence includes order, duplicates, and zero-unit records, not just totals.",
    "trace": "An available ID a with zero units still adds a to ids; another available a contributes its units and value and remains a second ID.",
    "alternative": "One pass reduces repeated traversal; several named passes can be easier to review. Both are linear, so clarity is a separate judgment.",
    "counterexample": "Deduplicating IDs or dropping zero-unit records makes the refactor change behavior.",
    "transfer": "Compare two designs using the same cases, then identify a readability improvement tests cannot establish."
  },
  "sum-matching-prices": {
    "reasoning": "The total summarizes all available entries, including repeated records.",
    "trace": "Available prices [100,100] contribute 200 even if IDs repeat; an unavailable price 50 contributes nothing.",
    "alternative": "A loop avoids an intermediate array; filter then reduce can separate selection from addition. Neither should deduplicate.",
    "counterexample": "Converting entries to a Set by ID undercounts repeated available entries.",
    "transfer": "Group available totals by category. Explain the Map state needed after every visit."
  },
  "count-open-tickets": {
    "reasoning": "Both status and inclusive priority conditions must hold for each counted record.",
    "trace": "With minimum -1, an open ticket at -1 counts, a closed ticket at 10 does not, and an open ticket at -2 does not.",
    "alternative": "A conjunction is concise; sequential guards can make each rejection reason clearer. Both use constant working storage.",
    "counterexample": "Using OR counts closed high-priority tickets and low-priority open ones.",
    "transfer": "Add an optional assignee filter and derive cases that distinguish AND from OR."
  },
  "first-label-ending": {
    "reasoning": "Normalize comparisons without replacing the original value returned to the caller.",
    "trace": "A label Report.TS with spaces matches ending .ts after trim and lowercase; return the original spaced label.",
    "alternative": "A loop stops on the first match; filtering all candidates is unnecessary. includes would implement a different relationship.",
    "counterexample": "Using includes accepts file.ts.backup for ending .ts even though the suffix does not match.",
    "transfer": "Return the last match instead and explain how stopping behavior changes."
  },
  "count-label-prefix": {
    "reasoning": "Blank labels are excluded even when a blank prefix matches all useful text.",
    "trace": "For [spaces,Ada with spaces,ada], blank prefix counts 2; prefix AD with spaces also counts 2.",
    "alternative": "Normalize the prefix once instead of per label. A loop counts without storing matching labels.",
    "counterexample": "A raw startsWith check misses surrounding spaces and case differences; deduplication loses repeated entries.",
    "transfer": "Group counts by the first normalized letter, deciding what to do with blank labels."
  },
  "first-duplicate-label": {
    "reasoning": "Membership is based on trimmed case-sensitive text and the second-occurrence rule.",
    "trace": "For [Ada with spaces,Bo,Ada], save Ada then Bo; the final Ada is a repeat and returns trimmed Ada.",
    "alternative": "A Set scan stops early; frequency counting followed by original-order selection may choose a different repeated label.",
    "counterexample": "Lowercasing collapses Ada and ada even though this contract distinguishes them.",
    "transfer": "Make comparisons case-insensitive but return the first original display label. What additional mapping is needed?"
  },
  "count-statuses": {
    "reasoning": "Initialize the full response shape so absence of occurrences is still represented.",
    "trace": "For [open,closed,open], counts progress to {open:2,closed:1}; [] stays {open:0,closed:0}.",
    "alternative": "Two fixed counters suit a closed set of statuses; a Map is more flexible when categories are dynamic.",
    "counterexample": "Adding keys only when observed omits closed for [open], breaking the promised shape.",
    "transfer": "Add a third allowed status and list the type, initialization, and tests that must change."
  },
  "remaining-actions": {
    "reasoning": "The stack contains the surviving actions after processing the visited instructions.",
    "trace": "For [A,B,UNDO,C], save A, save B, remove B, save C; return [A,C]. UNDO on an empty stack does nothing.",
    "traceSteps": {
      "code": [
        "function remainingActions(actions: string[]): string[] {",
        "  const stack: string[] = []",
        "  for (const action of actions) {",
        "    if (action === 'UNDO') stack.pop()",
        "    else stack.push(action)",
        "  }",
        "  return stack",
        "}"
      ],
      "input": "actions = ['A', 'UNDO', 'UNDO', 'B', 'C', 'UNDO', 'D']",
      "steps": [
        { "line": 1, "vars": { "stack": "[]" }, "structure": { "kind": "stack", "values": [] }, "note": "Start with no saved actions." },
        { "line": 2, "vars": { "action": "A", "stack": "[]" }, "structure": { "kind": "stack", "values": [] }, "note": "Read A. Nothing is saved yet." },
        { "line": 4, "vars": { "action": "A", "stack": "[A]" }, "structure": { "kind": "stack", "values": ["A"] }, "note": "A is not UNDO, so it is saved." },
        { "line": 2, "vars": { "action": "UNDO", "stack": "[A]" }, "structure": { "kind": "stack", "values": ["A"] }, "note": "Read the first UNDO." },
        { "line": 3, "vars": { "action": "UNDO", "stack": "[]" }, "structure": { "kind": "stack", "values": [] }, "note": "UNDO removes the most recent saved action, A." },
        { "line": 3, "vars": { "action": "UNDO", "stack": "[]" }, "structure": { "kind": "stack", "values": [] }, "note": "A second UNDO with nothing saved does nothing. The stack stays empty." },
        { "line": 4, "vars": { "action": "B", "stack": "[B]" }, "structure": { "kind": "stack", "values": ["B"] }, "note": "B is saved." },
        { "line": 4, "vars": { "action": "C", "stack": "[B, C]" }, "structure": { "kind": "stack", "values": ["B", "C"] }, "note": "C is saved above B." },
        { "line": 3, "vars": { "action": "UNDO", "stack": "[B]" }, "structure": { "kind": "stack", "values": ["B"] }, "note": "UNDO removes C, the most recent saved action." },
        { "line": 4, "vars": { "action": "D", "stack": "[B, D]" }, "structure": { "kind": "stack", "values": ["B", "D"] }, "note": "D is saved above B." },
        { "line": 6, "vars": { "result": "[\"B\", \"D\"]" }, "structure": { "kind": "stack", "values": ["B", "D"] }, "note": "The stack holds the surviving actions in their original order, so the function returns B and D." }
      ]
    },
    "alternative": "A stack handles the latest action directly. Filtering UNDO tokens removes commands but fails to undo their targets.",
    "counterexample": "Treating a blank action as absent loses a legitimate saved action; only exact UNDO is a command.",
    "transfer": "Add REDO. Explain which additional history and invalidation rules are needed."
  },
  "cancel-adjacent-ids": {
    "reasoning": "The stack is the reduced prefix, not a set of all IDs seen.",
    "trace": "For [1,2,2,1], push 1 and 2, pop 2, then pop 1; return [].",
    "alternative": "A stack is one pass with output-proportional storage. Repeated pair deletion can rescan the list.",
    "counterexample": "Global duplicate removal loses nonadjacent [1,2,1], which must remain unchanged.",
    "transfer": "Return the removed pairs as an audit trail while preserving the final remainder."
  },
  "validate-page-query": {
    "reasoning": "Rejection differs from clamping: invalid caller input must not become a successful request.",
    "trace": "{page:1,size:50,extra:true} returns a fresh {page:1,size:50}; size 51, size as text, and null fail.",
    "alternative": "Explicit guards expose limits; a reusable runtime schema helps repeated contracts. Neither should coerce unless requested.",
    "counterexample": "Clamping size 51 to 50 accepts a request that must return null.",
    "transfer": "Contrast this validator with backend-page-results, naming one input whose policy differs."
  },
  "derive-task-summary": {
    "reasoning": "The remaining count describes all unfinished tasks, not just the visible subset.",
    "trace": "With two unfinished tasks and a query matching only one, return one title and remaining 2; completed matches contribute neither.",
    "alternative": "One loop can count and select; separate derivations may read more clearly. Avoid storing derived values that can drift from inputs.",
    "counterexample": "Counting selected titles as remaining reports 1 instead of 2 when the query hides work.",
    "transfer": "Add a completed count without storing another independently mutable list."
  },
  "debug-page-offset": {
    "reasoning": "Translate one-based page numbers into zero-based positions before slicing.",
    "trace": "For [a,b,c,d,e], page 1 size 2 starts at 0 and returns [a,b]; page 2 starts at 2 and returns [c,d].",
    "alternative": "slice expresses a nonmutating page copy; splice changes the caller-owned array. A loop can copy but needs correct boundaries.",
    "counterexample": "page * size starts page 1 at 2 and skips the first two IDs.",
    "transfer": "Write adjacent-page cases showing no gaps or overlap, including a partial last page."
  },
  "project-team-directory": {
    "reasoning": "Module boundaries should make data selection testable separately from DOM construction.",
    "trace": "Follow query input into the selection module, receive original matching labels, then render them as text. Loading bypasses controls; Retry calls the supplied callback.",
    "alternative": "One file is easy initially; separate data and rendering modules help focused changes. Integration checks alone do not prove the separation is meaningful.",
    "counterexample": "Duplicating normalization in both modules can produce different matches in tests and rendering.",
    "transfer": "Add a team filter in the data module and trace the smallest rendering changes needed. Review focus manually."
  },
  "project-ticket-api": {
    "reasoning": "Trusted query parsing should be shared by counting and page selection.",
    "trace": "Reject a non-GET method first; pass a valid query through normalization, filter tickets once, count matches, and return the requested slice.",
    "alternative": "A query module centralizes defaults and validation. Keeping parsing in the handler is simpler initially but easier to duplicate across endpoints.",
    "counterexample": "Using separate search rules for count and page makes total inconsistent with returned items.",
    "transfer": "Add a second endpoint using the same query contract and identify what should remain handler-specific."
  },
  "shipping-cost-tiers": {
    "reasoning": "The loop only gathers two facts, the total weight and whether any line is bulky. The tier is chosen once from the total, and the handling charge is added once from the flag, so each fact is decided after the loop has seen every line.",
    "trace": "Lines 1000g x 3 and 5g x 11: total is 3000 + 55 = 3055, which is above 2000, so the base is 1200. The second line has quantity 11, so bulky is true and 200 is added once for a total of 1400. A second bulky line in the same order would not add another 200.",
    "alternative": "Adding the handling charge inside the loop is shorter to type but charges once per bulky line. Choosing the tier per line would price each line as its own shipment, which changes the contract.",
    "counterexample": "Returning 300 for an empty order because the total is zero treats no items as the lightest parcel. Checking the lower edge with 500 > total instead of total <= 500 shifts the boundary for exactly 500 grams.",
    "transfer": "Add a surcharge for lines heavier than 1000 grams each, charged once per line. Decide whether the surcharge is per line or per order before coding. This changed contract is self-reviewed, not checked by the original cases."
  },
  "countdown-labels": {
    "reasoning": "The value itself is the loop state. Looping while the value is at least zero means the last label is the last non-negative value the countdown reaches, and formatting is a separate step applied to each value.",
    "trace": "Start 130 with step 60: values 130, 70, 10 are labeled 2:10, 1:10, 0:10. The next value, -50, fails the test and stops the loop. Start 120 with step 60 reaches 0 exactly, so 0:00 appears.",
    "alternative": "Counting the number of labels first and then computing each value is also correct, but it adds a division that the countdown does not need. A while loop with the same condition reads the same way.",
    "counterexample": "Using value > 0 drops the 0:00 label for starts that land exactly on zero. Padding minutes as well as seconds turns 2:10 into 02:10, which the format does not ask for.",
    "transfer": "Count up from zero to a limit in steps and format each value as h:mm:ss. Decide the stop condition and how hours appear before coding. This changed contract is self-reviewed, not checked by the original cases."
  }
}
