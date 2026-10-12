import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const aiEraDepth: Record<string, RepDepth> = {
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
}

export const aiEraGuides: Record<string, ReflectionGuide> = {
  'verify-generated-code': {
    plan: ["Trace the draft with a blank first label.", "Find the first useful label in original order.", "Consider an empty list and only blank labels."],
    explanation: ["Describe actual versus expected output before the repair.", "Explain trimming and the no-match result."],
    example: "The draft returns a blank first label without inspecting later labels. I scan in order, trim each label, and return the first nonempty result. Otherwise I return null. Cost depends on the labels visited and their lengths.",
  },
  'frontend-visible-items': {
    plan: ["Normalize the query once.", "Keep only active matching items.", "Preserve original labels and order."],
    explanation: ["Explain why an empty normalized query matches every active label.", "Account for the work to process label text."],
    example: "I trim and lowercase the query, compare it with lowercase active labels, and return the original labels. This avoids changing display text. The scan visits every item and performs string processing for each active label.",
  },
  'frontend-view-state': {
    plan: ["Choose loading before other states.", "Check nonempty error next.", "Use count only when loading and error are absent."],
    explanation: ["Explain conflicting inputs such as loading with an error.", "Explain why an empty error string is ignored."],
    example: "I check loading, then a nonempty error, then zero count. Everything else is ready. Explicit precedence prevents an unfinished request from appearing empty. The function uses O(1) time and space.",
  },
  'backend-validate-user': {
    plan: ["Reject null, arrays, and primitive values before field access.", "Validate name and integer age including both bounds.", "Return a new normalized result."],
    explanation: ["Explain why TypeScript alone cannot validate an unknown request.", "Describe what happens for missing fields and wrong types."],
    example: "I check object shape before reading fields, require a trimmed nonblank name and an integer age from 0 through 120, and return a new object. Invalid input returns null. Name trimming requires work proportional to its length.",
  },
  'backend-page-results': {
    plan: ["Clamp page and size before calculating the offset.", "Use the normalized size for both offset and end.", "Consider empty input and a page past the end."],
    explanation: ["Explain one-based pages versus zero-based array indices.", "Show how you preserve the input."],
    example: "I normalize page and size, calculate (page - 1) * size, and return a slice. Slice leaves the input unchanged. The result holds at most three IDs, so copying it has bounded time and extra space.",
  },
  'interview-frontend': {
    plan: ["Restate which tasks qualify and how ties work.", "Order a new array by descending priority.", "Return titles without changing any input objects."],
    explanation: ["Explain filtering, stable ties, and mutation prevention.", "Discuss sorting cost and a possible larger-data tradeoff."],
    example: "I filter unfinished tasks into a new array, sort it by descending priority, and map to titles. Stable sorting preserves ties. For m unfinished tasks among n inputs, typical comparison sorting costs O(n + m log m) time and the copied data uses O(m) space.",
  },
  'interview-backend': {
    plan: ["Restate the deliberately small email and role contract.", "Check shape and types before normalization.", "Consider missing sides, repeated @, and invalid roles."],
    explanation: ["Explain what this contract leaves unchecked, including internal spaces.", "Distinguish validation from normalization."],
    example: "I reject invalid shapes and roles, trim the email, and require exactly one @ with nonblank text on each side. I lowercase valid email text. This is not complete email validation and allows internal spaces under the stated rules. String processing scales with email length.",
  },
}
