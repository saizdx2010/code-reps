import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const foundationsDepth: Record<string, RepDepth> = {
  'function-returns-function': {
    traceSteps: {
      code: [
        'function makeAdder(amount: number): (x: number) => number {',
        '  return x => x + amount',
        '}',
        'function addAll(amount: number, values: number[]): number[] {',
        '  const add = makeAdder(amount)',
        '  const result = values.map(value => add(value))',
        '  return result',
        '}',
      ],
      input: 'amount = 5, values = [3, -5, 0]',
      steps: [
        {
          line: 3,
          vars: { amount: 5 },
          structure: { kind: 'array', values: [3, -5, 0] },
          note: 'addAll receives the amount 5 and three values. No adder exists yet.',
        },
        {
          line: 4,
          vars: { amount: 5 },
          structure: { kind: 'array', values: [3, -5, 0] },
          note: 'Call makeAdder(5). This runs the first function once and gives back a function.',
        },
        {
          line: 1,
          vars: { amount: 5, add: 'x => x + 5' },
          structure: {
            kind: 'state',
            entries: [
              ['amount inside makeAdder', 5],
              ['returned function', 'x => x + 5'],
            ],
          },
          note: 'makeAdder returns a small function. It keeps amount 5 with it, even after makeAdder is done.',
        },
        {
          line: 5,
          vars: { amount: 5, add: 'x => x + 5', value: 3 },
          structure: { kind: 'array', values: [3, -5, 0], pointers: { value: 0 } },
          note: 'map calls add with 3. The returned function computes 3 + 5 = 8. Result so far: [8].',
        },
        {
          line: 5,
          vars: { amount: 5, add: 'x => x + 5', value: -5 },
          structure: { kind: 'array', values: [3, -5, 0], pointers: { value: 1 }, dimmed: [0] },
          note: 'Next value is -5. The same add function computes -5 + 5 = 0. Result so far: [8, 0].',
        },
        {
          line: 5,
          vars: { amount: 5, add: 'x => x + 5', value: 0 },
          structure: { kind: 'array', values: [3, -5, 0], pointers: { value: 2 }, dimmed: [0, 1] },
          note: 'Last value is 0. The same add function computes 0 + 5 = 5. Result: [8, 0, 5].',
        },
        {
          line: 6,
          vars: { amount: 5, result: '[8, 0, 5]' },
          structure: { kind: 'array', values: [8, 0, 5] },
          note: 'Return the new array. The input values were never changed, and makeAdder ran only once.',
        },
      ],
    },
    reasoning:
      'makeAdder builds a function that adds a fixed amount. Because addAll builds that function once and applies it to every value, each output depends only on its own input value and the amount.',
    trace:
      'For amount 5 and values [3, -5, 0], makeAdder(5) returns a function that adds 5. Applying it gives 8, 0, and 5. For an empty array, no value is visited and the result is an empty array.',
    alternative:
      'Writing values.map(value => value + amount) gives the same output with one function fewer, but it does not practice returning a function. Calling makeAdder(amount)(value) inside the callback works too, yet it builds a new function for every value.',
    counterexample:
      'Having makeAdder return amount + x directly instead of a function breaks the call add(value), because a number cannot be called. Using values.forEach and ignoring its results returns an empty array.',
    transfer:
      'Write makeMultiplier(factor) and use it to scale each value. Decide what stays fixed and what arrives later. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'declare-variables': {
    reasoning: 'A name and its value are different: const protects the binding, not every value reachable through it.',
    trace: 'With name Ada, greeting remains Hello plus a space; message becomes Hello, Ada. With an empty name the space remains.',
    alternative:
      'Returning the concatenation directly is shorter but does not practice the requested declarations. let is justified when reassignment is needed, not merely because a value is calculated.',
    counterexample: 'Removing the trailing space produces HelloAda. Output checks still cannot prove which declarations you used.',
    transfer: 'Change the task to build a message in two assignments. Which binding now needs let?',
  },
  'basic-types': {
    reasoning: 'Formatting must preserve the values supplied, including falsy values.',
    trace: 'For Bo, 0, false the sentence is Bo is 0. Active: false. Neither 0 nor false disappears.',
    alternative:
      'Concatenation and template strings can both work; template strings make the punctuation easier to inspect. Neither validates unknown runtime data.',
    counterexample: 'Using age || 18 replaces a legitimate zero. Explain why a default would change the contract.',
    transfer: 'Add an optional nickname with a documented missing-value rule. Distinguish absent text from an empty string.',
  },
  'create-objects': {
    reasoning: 'An object gives related properties one identity and a documented shape.',
    trace: 'Create {name: Ada, age: 28}, read person.name and person.age, then form Ada is 28 years old.',
    alternative:
      'Using parameters directly gives the same sentence but bypasses the object-learning goal. A type documents shape without validating network input.',
    counterexample: 'A correct sentence alone does not prove an object was created. Inspect the code as well as the result.',
    transfer: 'Add a city property and explain which type and construction sites must change.',
  },
  'make-arrays': {
    reasoning: 'Absence of an item differs from an item containing empty text.',
    trace: '[] has length zero and returns null; [empty string, Ada] has an item at zero and returns that empty string.',
    alternative:
      'names[0] ?? null can express absence compactly under this contract. An explicit length check makes the empty-array rule visible.',
    counterexample: 'names[0] || null incorrectly turns an empty first name into null.',
    transfer: 'Return the last item instead. Explain how the empty case changes the index calculation.',
  },
  'write-functions': {
    reasoning: 'Returning transfers a computed value to a caller that can use it again.',
    trace: 'price 2.5 and quantity 2 produce 5; quantity zero produces zero without a special branch.',
    alternative:
      'Printing the product helps inspection but is not a replacement for return. Extra state is unnecessary for one expression.',
    counterexample: 'Hardcoding 15 passes the example but fails price 2.5 and quantity 2.',
    transfer: 'Use the returned total in a second calculation and explain why console.log cannot supply that value.',
  },
  'pass-or-retry': {
    reasoning:
      'One comparison splits every score into two groups. Using >= puts the edge value 50 in the passing group, and the final return covers everything else.',
    trace:
      'For 50, 50 >= 50 is true, so the result is Pass. For 49, 49 >= 50 is false, so the if block is skipped and the final return gives Retry.',
    alternative:
      'An if with else makes both branches visible, while an early return needs no else. A conditional expression is shorter but harder to read while you are learning the boundary.',
    counterexample: 'Writing score > 50 sends exactly 50 to Retry. The edge check at 50 exposes it, and the example 72 would not.',
    transfer: 'Change the rule so a score must be above 50 to pass, then name which check changes and what 50 returns.',
  },
  'use-conditions': {
    traceSteps: {
      code: [
        'function gradeLabel(score: number): string {',
        "  if (score < 0 || score > 100) return 'Invalid'",
        "  if (score >= 90) return 'A'",
        "  if (score >= 80) return 'B'",
        "  if (score >= 70) return 'C'",
        "  if (score >= 60) return 'D'",
        "  return 'F'",
        '}',
      ],
      input: 'score = 60',
      steps: [
        {
          line: 0,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['score', 60],
              ['rules that did not match', 'none'],
              ['grade', 'not chosen'],
            ],
          },
          note: 'The score is 60. Check the invalid range first.',
        },
        {
          line: 1,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['score', 60],
              ['rules that did not match', 'none'],
              ['grade', 'not chosen'],
            ],
          },
          note: 'Is 60 below 0 or above 100? No, so the invalid rule does not match.',
        },
        {
          line: 2,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['score', 60],
              ['rules that did not match', 'invalid range'],
              ['grade', 'not chosen'],
            ],
          },
          note: '60 is not 90 or more, so the A rule does not match.',
        },
        {
          line: 3,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['score', 60],
              ['rules that did not match', 'invalid range, A'],
              ['grade', 'not chosen'],
            ],
          },
          note: '60 is not 80 or more, so the B rule does not match.',
        },
        {
          line: 4,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['score', 60],
              ['rules that did not match', 'invalid range, A, B'],
              ['grade', 'not chosen'],
            ],
          },
          note: '60 is not 70 or more, so the C rule does not match.',
        },
        {
          line: 5,
          vars: { result: 'D' },
          structure: {
            kind: 'state',
            entries: [
              ['score', 60],
              ['rules that did not match', 'invalid range, A, B, C'],
              ['grade', 'D'],
            ],
          },
          note: '60 is at least 60, so the grade is D. The lower edge belongs to D.',
        },
      ],
    },
    reasoning:
      'Checking the invalid range first keeps out-of-range scores away from the grade bands. Each grade test assumes every higher band has already failed, so the order defines the boundaries.',
    trace:
      'For 90, the 90 test passes first and returns A. For 89.9 that test fails, the 80 test fails, the 70 test fails, the 60 test passes, and the result is B only if 89.9 is at least 80. For 101 the range guard returns Invalid before any grade test runs.',
    alternative:
      'A table of score ranges is compact, but each inclusive or exclusive edge must be written correctly. Separate if statements make each boundary visible when you trace a value.',
    counterexample:
      'Writing score > 90 for A sends exactly 90 to B, which breaks the contract. The boundary value is where this mistake appears.',
    transfer: 'Add a plus band for 97 and above, and explain which branch must come first and what 96.5 returns.',
  },
  'loop-with-for': {
    traceSteps: {
      code: [
        'function sumUpTo(n: number): number {',
        '  let total = 0',
        '  for (let i = 1; i <= n; i++) {',
        '    total += i',
        '  }',
        '  return total',
        '}',
      ],
      input: 'n = 4',
      steps: [
        {
          line: 1,
          vars: { n: 4 },
          note: 'n is 4, so the loop counts from 1 up to 4. If n were 0, the loop would never run and the result would be 0.',
        },
        { line: 2, vars: { n: 4, total: 0, i: 1 }, note: 'i starts at 1. Since 1 is at most 4, the loop body runs.' },
        { line: 3, vars: { n: 4, total: 0, i: 1 }, note: 'Add 1: the total goes from 0 to 1.' },
        { line: 2, vars: { n: 4, total: 1, i: 2 }, note: 'i is now 2. It is still at most 4, so the body runs again.' },
        { line: 3, vars: { n: 4, total: 1, i: 2 }, note: 'Add 2: the total goes from 1 to 3.' },
        { line: 3, vars: { n: 4, total: 3, i: 3 }, note: 'i is now 3. Add 3: the total goes from 3 to 6.' },
        { line: 3, vars: { n: 4, total: 6, i: 4 }, note: 'i is now 4. Add 4: the total goes from 6 to 10.' },
        { line: 2, vars: { n: 4, total: 10, i: 5 }, note: 'i is 5, which is more than 4, so the loop stops.' },
        { line: 5, vars: { n: 4, total: 10, result: 10 }, note: 'Return the total, 10.' },
      ],
    },
    reasoning:
      'The total is the sum of the values already visited. It starts at zero, so the empty range is correct, and each pass adds the next value until i passes n.',
    trace:
      'For n = 4 the total becomes 1, 3, 6, and 10 as i takes 1, 2, 3, and 4. For n = 0 the condition 1 <= 0 is false, so the loop never runs and 0 is returned.',
    alternative:
      'The formula n * (n + 1) / 2 returns the same result without visiting each value. The loop is easier to change when the rule adds only selected values.',
    counterexample: 'Using i < n omits n. For n = 4 it returns 6 instead of 10.',
    transfer: 'Sum only the odd numbers from 1 through n. Decide the starting value and the step size before you write the loop body.',
  },
  'loop-while': {
    traceSteps: {
      code: [
        'function stepsToOne(n: number): number {',
        '  let value = n',
        '  let steps = 0',
        '  while (value > 1) {',
        '    value = Math.floor(value / 2)',
        '    steps++',
        '  }',
        '  return steps',
        '}',
      ],
      input: 'n = 9',
      steps: [
        { line: 1, vars: { n: 9 }, note: 'The starting number is 9. No halving has happened yet.' },
        { line: 3, vars: { value: 9, steps: 0 }, note: '9 is more than 1, so the loop body runs.' },
        { line: 5, vars: { value: 4, steps: 0 }, note: '9 halved and rounded down is 4. Count this step: steps goes from 0 to 1.' },
        { line: 3, vars: { value: 4, steps: 1 }, note: '4 is more than 1, so the loop runs again.' },
        { line: 5, vars: { value: 2, steps: 1 }, note: '4 halved is 2. Count this step: steps goes from 1 to 2.' },
        { line: 3, vars: { value: 2, steps: 2 }, note: '2 is more than 1, so one more halving is needed.' },
        { line: 5, vars: { value: 1, steps: 2 }, note: '2 halved is 1. Count this step: steps goes from 2 to 3.' },
        { line: 3, vars: { value: 1, steps: 3 }, note: '1 is not more than 1, so the loop stops.' },
        { line: 7, vars: { value: 1, steps: 3, result: 3 }, note: 'Return the step count, 3.' },
      ],
    },
    reasoning:
      'The loop tests the current value before each halving. When the value reaches 1 no further halving is needed, so the count equals the number of halvings performed.',
    trace:
      'Starting with 9, the value is greater than 1, so it becomes 4 and steps becomes 1. Then 4 becomes 2 and steps becomes 2. Then 2 becomes 1 and steps becomes 3. The value 1 fails the condition, so the result is 3.',
    alternative:
      'A for loop with a manual break can work, but the while condition states the stopping rule directly. Bit operations count bit length, but they hide the halving rule this rep asks you to practice.',
    counterexample:
      'Using value / 2 without Math.floor gives 9 four steps: 4.5, 2.25, 1.125, and 0.5625. The value stays fractional, so the count is wrong.',
    transfer:
      'Repeat the halving rule until the value is 0 instead. Explain why an input of 1 never reaches 0 under floor division, and what this means for the loop.',
  },
  'string-basics': {
    reasoning:
      'Trimming removes display padding before words are split. Each initial comes from the first character of an actual word, so the empty name gives an empty result rather than a special error.',
    trace:
      "For '  grace   hopper ', trim gives 'grace   hopper'. Splitting on whitespace runs gives grace and hopper, so the first letters give GH. For an empty name the split result is one empty word, and slice(0, 1) gives an empty string.",
    alternative:
      'A regular expression that matches word starts can extract initials in one step. Splitting is easier to trace, but it still needs a rule for repeated separators.',
    counterexample:
      "Splitting '  grace   hopper' on single spaces creates empty words. Calling word[0].toUpperCase() on an empty word throws an error. slice(0, 1) returns an empty string for those words instead.",
    transfer:
      'Return the first letter of the first and last words only. Decide what a one-word name should return before you change the code.',
  },
  'object-update': {
    traceSteps: {
      code: [
        'type Task = { title: string; done: boolean; priority: number }',
        'function setDone(task: Task, done: boolean): Task {',
        '  const before = task.done',
        '  const copy: Task = { ...task }',
        '  copy.done = done',
        '  const changed = before !== done',
        '  return copy',
        '}',
      ],
      input: "task = { title: 'Write', done: false, priority: 2 }, done = true",
      steps: [
        {
          line: 1,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['original done', false],
              ['copy done', 'not made'],
            ],
          },
          note: 'The function receives the task and the requested done value. The task must stay unchanged.',
        },
        {
          line: 2,
          vars: {},
          structure: {
            kind: 'state',
            entries: [
              ['original done', false],
              ['copy done', 'not made'],
            ],
          },
          note: 'Save the original done flag, false, so it can be compared later.',
        },
        {
          line: 3,
          vars: { before: false },
          structure: {
            kind: 'state',
            entries: [
              ['original done', false],
              ['copy done', 'not made'],
            ],
          },
          note: 'Make a new object with the same title, done flag, and priority.',
        },
        {
          line: 4,
          vars: { before: false },
          structure: {
            kind: 'state',
            entries: [
              ['original done', false],
              ['copy done', false],
            ],
          },
          note: 'The copy starts with done false. Next, set done on the copy only.',
        },
        {
          line: 5,
          vars: { before: false },
          structure: {
            kind: 'state',
            entries: [
              ['original done', false],
              ['copy done', true],
            ],
          },
          note: 'Only the copy now has true. The original still has false.',
        },
        {
          line: 6,
          vars: { before: false, changed: true, result: '{"title": "Write", "done": true, "priority": 2}' },
          structure: {
            kind: 'state',
            entries: [
              ['original done', false],
              ['copy done', true],
            ],
          },
          note: 'The flag changed, so changed is true. Return the new copy.',
        },
      ],
    },
    reasoning:
      'The caller keeps its original task. Returning a new object makes the change explicit, and code that still holds the old value sees no surprise.',
    trace:
      "For { title: 'Write', done: false, priority: 2 } with done true, the spread copies title and priority, then done replaces false. The supplied object still has done false afterward.",
    alternative:
      "Object.assign({}, task, { done }) gives the same result and is more verbose. Assigning task.done directly is shorter but changes the caller's object.",
    counterexample:
      'task.done = done; return task can return the right value. It fails because the supplied object changed, which the input check detects.',
    transfer:
      'Update one field inside a nested settings object. Explain why one spread is no longer enough and which nested objects must be copied.',
  },
  'shipping-cost-tiers': {
    reasoning:
      'The loop only gathers two facts, the total weight and whether any line is bulky. The tier is chosen once from the total, and the handling charge is added once from the flag, so each fact is decided after the loop has seen every line.',
    trace:
      'Lines 1000g x 3 and 5g x 11: total is 3000 + 55 = 3055, which is above 2000, so the base is 1200. The second line has quantity 11, so bulky is true and 200 is added once for a total of 1400. A second bulky line in the same order would not add another 200.',
    alternative:
      'Adding the handling charge inside the loop is shorter to type but charges once per bulky line. Choosing the tier per line would price each line as its own shipment, which changes the contract.',
    counterexample:
      'Returning 300 for an empty order because the total is zero treats no items as the lightest parcel. Checking the lower edge with 500 > total instead of total <= 500 shifts the boundary for exactly 500 grams.',
    transfer:
      'Add a surcharge for lines heavier than 1000 grams each, charged once per line. Decide whether the surcharge is per line or per order before coding. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'countdown-labels': {
    reasoning:
      'The value itself is the loop state. Looping while the value is at least zero means the last label is the last non-negative value the countdown reaches, and formatting is a separate step applied to each value.',
    trace:
      'Start 130 with step 60: values 130, 70, 10 are labeled 2:10, 1:10, 0:10. The next value, -50, fails the test and stops the loop. Start 120 with step 60 reaches 0 exactly, so 0:00 appears.',
    alternative:
      'Counting the number of labels first and then computing each value is also correct, but it adds a division that the countdown does not need. A while loop with the same condition reads the same way.',
    counterexample:
      'Using value > 0 drops the 0:00 label for starts that land exactly on zero. Padding minutes as well as seconds turns 2:10 into 02:10, which the format does not ask for.',
    transfer:
      'Count up from zero to a limit in steps and format each value as h:mm:ss. Decide the stop condition and how hours appear before coding. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'batch-slot-labels': {
    reasoning:
      'Each iteration removes one nonempty batch from the remaining items. The count never exceeds capacity or remaining, so the labels partition the total.',
    trace:
      'For total 7 and capacity 3, remaining moves 7 to 4 to 1 to 0, giving counts 3, 3, 1. For total 6 it stops after two full batches.',
    alternative:
      'A for loop over offsets also takes O(number of batches) time and output space. Tracking remaining makes the short final batch explicit.',
    counterexample: 'A loop allowing remaining equal to zero adds Batch 3: 0 items for total 6, capacity 3.',
    transfer:
      'Allow different capacities on different days. Decide what happens if the schedule ends before all items are packed. This transfer is self-reviewed.',
  },
  'inspection-run-summary': {
    reasoning:
      'The running streak ends whenever a reading fails the strict threshold. Updating the maximum on every alert includes a streak at the end.',
    trace: 'For [7,0,8,9,10] at limit 5, streak lengths are 1,0,1,2,3; alerts is 4 and longestRun is 3.',
    alternative:
      'Collecting streak lengths then taking their maximum is readable but needs extra storage. One pass uses O(n) time and constant working space.',
    counterexample: 'Updating the maximum only when a streak ends misses [8,9,10] at limit 5 entirely.',
    transfer:
      'Require at least two consecutive alerts before sounding an alarm. Decide when the alarm resets. This transfer is self-reviewed.',
  },
}

export const foundationsGuides: Record<string, ReflectionGuide> = {
  'declare-variables': {
    plan: ['Name the fixed greeting and the combined message.', 'Keep the trailing space in the greeting.'],
    explanation: [
      'Check your use of const and let yourself; output checks cannot establish it.',
      'Explain what happens with an empty name.',
    ],
    example:
      'The greeting stays the same, so I use const. I store the combined greeting and name in message using let. The checks verify the output, while I review the declarations myself.',
  },
  'basic-types': {
    plan: ['Identify the string, number, and boolean inputs.', 'Match the punctuation and spacing in the example.'],
    explanation: ['Explain how each value becomes part of the sentence.', 'Show that false and zero are preserved.'],
    example: 'I combine all three inputs into one template string. False and zero are values to display, not reasons to skip a field.',
  },
  'create-objects': {
    plan: ['Create a person with both supplied properties.', 'Read the properties to build the sentence.'],
    explanation: [
      'Review your object and Person type yourself; output checks cannot prove their use.',
      'Explain the difference between a property and a local variable.',
    ],
    example:
      'I create a Person object from name and age, then read person.name and person.age. The sentence checks do not prove that I used an object or checked its type.',
  },
  'make-arrays': {
    plan: ['Handle an empty array before reading its first item.', 'Use the first index.'],
    explanation: ['Explain why an empty string is still a valid first item.', 'Describe the time and extra storage used.'],
    example:
      'I return null only when length is zero; otherwise I return index 0. Reading the length and first item takes O(1) time and extra space.',
  },
  'write-functions': {
    plan: ['Identify price and quantity as inputs.', 'Return their product.'],
    explanation: ['Explain the difference between returning and printing.', 'Describe zero quantity.'],
    example:
      'I return price multiplied by quantity. Zero quantity gives zero. This uses a fixed number of arithmetic operations and O(1) extra space.',
  },
  'pass-or-retry': {
    plan: ['Decide which comparison includes 50.', 'Decide what the code returns when the comparison is false.'],
    explanation: ['Explain why 50 passes but 49 does not.', 'Describe what the final return handles.'],
    example:
      'I return Pass when the score is at least 50, so 50 itself passes. Every other score reaches the final return, which gives Retry. The checks verify both branches and the edge; I review my comparison myself.',
  },
  'use-conditions': {
    plan: ['Handle scores outside 0 through 100 first.', 'Check the highest grade band first, then each lower band.'],
    explanation: ['Explain why 90 is A while 89.9 is B.', 'Describe which branch handles scores below 60.'],
    example:
      'I return Invalid for scores outside 0 through 100 before any grade check. Then I test 90, 80, 70, and 60 in that order, so each band is one branch. Scores below 60 reach the final return. The checks verify labels at the boundaries; I review my branch order myself.',
  },
  'function-returns-function': {
    plan: ['Decide what makeAdder(5) gives back.', 'Decide where addAll builds the adder, and how often.'],
    explanation: [
      'Explain why the returned function can still use amount after makeAdder has finished.',
      'Explain why addAll builds the adder once instead of once per value.',
    ],
    example:
      'makeAdder returns a small function that adds amount to its input. addAll calls makeAdder once, keeps the result in a const, and maps over the values with it, so the input array is unchanged. An empty array maps to an empty array. The checks verify outputs; I review the one call to makeAdder myself.',
  },
  'loop-with-for': {
    plan: ['Start the total at zero.', 'Decide where the loop starts and whether it includes n.'],
    explanation: ['Explain why the loop includes n itself.', 'Explain what happens when n is zero.'],
    example:
      'I start total at 0 and count i from 1 through n, adding each value. For 0 the loop body never runs, so total stays 0. The loop does n additions, which is O(n) time and O(1) extra space. A formula would also work, but this rep practices the loop.',
  },
  'loop-while': {
    plan: ['Write the condition that keeps the loop running.', 'Predict the steps for 9 by hand.'],
    explanation: ['Explain why Math.floor keeps each value whole.', 'Explain why an input of 1 returns 0 without special handling.'],
    example:
      'I keep steps at 0 and loop while value is greater than 1. Each pass sets value to Math.floor(value / 2) and adds one step. For 9 the values are 4, 2, and 1, so there are three steps. Each pass lowers the value, so the loop ends in O(log n) time with O(1) extra space.',
  },
  'string-basics': {
    plan: ['Trim the name before splitting it.', 'Decide what an empty name returns.'],
    explanation: ['Explain why one or more spaces separate words.', 'Explain how slice(0, 1) behaves on an empty word.'],
    example:
      'I trim the name, split it on runs of whitespace, take the first character of each word, uppercase it, and join the letters. An empty name becomes one empty word, so the result is an empty string. The checks verify the output; I review the splitting rule myself.',
  },
  'object-update': {
    plan: ['Name the one field that changes.', 'Decide how the received task stays unchanged.'],
    explanation: ['Explain why the spread creates a new object.', 'Explain what the input check detects.'],
    example:
      'I create updated with { ...task, done }, so every existing field is copied and done is replaced. I return updated and never assign to task. The checks compare the returned object and also detect changes to the supplied object. This copy is shallow, which is enough for these primitive fields.',
  },
  'shipping-cost-tiers': {
    plan: [
      'Add weight times quantity for every line.',
      'Choose one tier from the total, checking the upper edges in order.',
      'Set a flag for bulky lines and add the handling charge once.',
    ],
    explanation: [
      'Trace an order that crosses the 2000 gram edge and has two bulky lines.',
      'Explain why the handling charge is added once, not per line.',
      'Explain why an empty order costs zero rather than the lightest tier.',
    ],
    example:
      'I loop over each line, adding weight times quantity to total and turning on bulky when a quantity is above 10. After the loop I choose 300, 600, or 1200 cents from total and add 200 once if bulky is set. Two bulky lines of 110 and 240 grams give a total of 350 and a charge of 500. The loop does one pass, so the work is O(n) time and O(1) extra space.',
  },
  'countdown-labels': {
    plan: [
      'Start the value at the starting seconds.',
      'Stop before the value would drop below zero.',
      'Format minutes without padding and seconds with two digits.',
    ],
    explanation: [
      'Trace 130 seconds with a 60-second step through each pass.',
      'Explain why a step that lands exactly on zero includes 0:00.',
      'Explain why a zero start gives one label.',
    ],
    example:
      'I start value at startSeconds and loop while value is at least zero, subtracting stepSeconds each pass. Each label is Math.floor(value / 60), a colon, and the remainder padded to two digits. For 130 with a 60-second step the values are 130, 70, and 10, so the labels are 2:10, 1:10, and 0:10. The work is one pass per label, O(n) time for n labels, with O(1) extra space beyond the output.',
  },
  'batch-slot-labels': {
    plan: [
      'Predict the labels for zero items and an exact multiple of capacity.',
      'Predict the ordinary and boundary examples before coding.',
    ],
    explanation: [
      'Explain why the final batch is nonempty and cannot exceed capacity.',
      'Explain a boundary and a plausible mistake; passing checks does not prove independent understanding.',
    ],
    example:
      'Each iteration removes one nonempty batch from the remaining items. The count never exceeds capacity or remaining, so the labels partition the total. For total 7 and capacity 3, remaining moves 7 to 4 to 1 to 0, giving counts 3, 3, 1. For total 6 it stops after two full batches.',
  },
  'inspection-run-summary': {
    plan: [
      'Distinguish total alerts from the longest uninterrupted alert streak.',
      'Predict the ordinary and boundary examples before coding.',
    ],
    explanation: [
      'Trace a streak that reaches the final reading and one broken by equality.',
      'Explain a boundary and a plausible mistake; passing checks does not prove independent understanding.',
    ],
    example:
      'The running streak ends whenever a reading fails the strict threshold. Updating the maximum on every alert includes a streak at the end. For [7,0,8,9,10] at limit 5, streak lengths are 1,0,1,2,3; alerts is 4 and longestRun is 3.',
  },
}
