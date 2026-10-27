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
    reasoning:
      '`greeting` is fixed text, so `const` states that this name will never point at another value. `message` really does change: it starts as the greeting and then gains the name, so it needs `let`. The function returns whatever `message` holds at the end.',
    trace:
      'For `Ada`, `greeting` is `"Hello, "` and `message` starts as `"Hello, "`. Reassigning adds the name, so `message` becomes `"Hello, Ada"` and that is returned. For an empty name, adding `""` leaves `message` as `"Hello, "`, trailing space included.',
    alternative:
      '`const message = greeting + name`, or returning `greeting + name` directly, gives the same output. In real code that is the better choice, because nothing is reassigned. This rep adds the reassignment so you practice the one case where `let` is needed.',
    counterexample:
      '`const greeting = "Hello,"` without the trailing space returns `"Hello,Ada"`, and the first check points at character 7. Declaring `message` with `const` and then reassigning it stops with an error, because a `const` name cannot be reassigned.',
    transfer:
      'Build the message in three steps: start with `greeting`, add the name, then add `"!"` at the end. Which names change, and which can stay `const`? This changed contract is self-reviewed, not checked by the original cases.',
  },
  'basic-types': {
    reasoning:
      'Each value has one fixed place in the sentence. A template string turns the number and the boolean into text exactly as they are, so `0` and `false` need no special handling.',
    trace:
      'For `Ada`, `28`, `true` the template fills in `Ada`, then `28`, then `true`: `Ada is 28. Active: true`. For `Bo`, `0`, `true` the age slot shows `0`, and for `Lee`, `42`, `false` the last slot shows `false`.',
    alternative:
      'Joining with `+`, as in `name + " is " + age + ". Active: " + active`, gives the same text, but the spaces and the period are harder to check by eye. Neither version checks that values arriving from outside the program really have these types.',
    counterexample:
      'Writing `${age || "unknown"}` looks like a safe default, but `||` treats `0` as missing, so `Bo` becomes `Bo is unknown`. Writing `active ? "yes" : "no"` changes the required words `true` and `false`.',
    transfer:
      'Add an optional nickname shown in brackets after the name. Decide what an empty nickname shows, and how that differs from no nickname at all. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'create-objects': {
    reasoning:
      'The object groups the two values under one name, and the `Person` type says exactly which properties it must have. Reading `person.name` and `person.age` gets back what you stored, so the sentence comes from the object rather than from loose variables.',
    trace:
      'For `Ada` and `28`, `person` becomes `{ name: "Ada", age: 28 }`. `person.name` is `Ada` and `person.age` is `28`, so the sentence is `Ada is 28 years old`. For `Bo` and `0` the `age` property holds `0`, and the sentence is `Bo is 0 years old`.',
    alternative:
      'Using the parameters directly gives the same sentence with less code, but skips the object this rep practices. The shorthand `{ name, age }` and the long form `{ name: name, age: age }` build the same object.',
    counterexample:
      'Writing `{ name: name }` without `age` is a type error, because `Person` requires both properties. If it runs anyway, `person.age` is `undefined` and the sentence becomes `Ada is undefined years old`. Writing `year` instead of `years` fails every check.',
    transfer:
      'Add a `city` property and end the sentence with `"and lives in {city}"`. Name every place in the code that must change. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'make-arrays': {
    reasoning:
      'No item is different from an item that holds empty text. The length tells you which case you have, and index 0 reads the first item without changing the array.',
    trace:
      'For `["Ada", "Sam"]` the length is 2, so index 0 gives `Ada`. `[]` has length 0 and returns `null`. `["", "Ada"]` has length 2, so index 0 gives the empty string, which is returned as it is.',
    alternative:
      '`names[0] ?? null` also works: reading past the end gives `undefined`, and `??` swaps only `undefined` or `null` for `null`. An explicit length check makes the empty-array rule easier to see.',
    counterexample:
      '`names[0] || null` turns an empty first name into `null`, because `""` counts as false. `names.shift()` returns the right name but removes it from the caller’s array, which the checks report as a changed input.',
    transfer:
      'Return the last item instead. Work out its index from the length, and decide what an empty array returns. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'write-functions': {
    reasoning:
      '`return` hands the computed total back to the caller, which can store it or use it in another calculation. One multiplication covers every case, including 0 items and decimal prices.',
    trace:
      '`totalPrice(5, 3)` computes 5 times 3 and returns 15. `totalPrice(1.25, 3)` returns 3.75, and `totalPrice(8, 0)` returns 0 without a special branch.',
    alternative:
      'Storing the product in `const total` and returning `total` is equally correct and gives the value a name. `console.log(price * quantity)` shows the number but the function then returns `undefined`, so the caller has nothing to use.',
    counterexample:
      'Hardcoding `return 15` passes the example but fails every other check. Writing `price + quantity` returns 8 for the example instead of 15.',
    transfer:
      'Write a second function that adds a fixed shipping charge of 2 to `totalPrice(price, quantity)`. Explain why it needs `totalPrice` to return its value rather than print it. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'pass-or-retry': {
    reasoning:
      'One comparison splits every score into two groups. Using `>=` puts the edge value 50 in the passing group, and the final `return` covers everything else.',
    trace:
      'For 50, `50 >= 50` is `true`, so the result is `Pass`. For 49, `49 >= 50` is `false`, so the `if` block is skipped and the final `return` gives `Retry`.',
    alternative:
      'An `if` with `else` makes both branches visible, while an early `return` needs no `else`. A conditional expression is shorter but harder to read while you are learning the boundary.',
    counterexample: 'Writing `score > 50` sends exactly 50 to `Retry`. The edge check at 50 exposes it, and the example 72 would not.',
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
          note: '60 is at least 60, so the grade is `D`. The lower edge belongs to D.',
        },
      ],
    },
    reasoning:
      'Checking the invalid range first keeps out-of-range scores away from the grade bands. Each grade test assumes every higher band has already failed, so the order defines the boundaries.',
    trace:
      'For the example 85, the range guard and the 90 test fail, and the 80 test passes, so the result is `B`. For 90 the A test passes first. For 89.9 the A test fails and the B test passes. For 59.9 every band test fails and the final `return` gives `F`. For 101 the range guard returns `Invalid` before any band is tested.',
    alternative:
      'A table of score ranges is compact, but each inclusive or exclusive edge must be written correctly. Separate `if` statements make each boundary visible when you trace a value.',
    counterexample:
      'Writing `score > 90` for A sends exactly 90 to B, which breaks the contract. The boundary value is where this mistake appears.',
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
          note: '`n` is 4, so the loop counts from 1 up to 4. If `n` were 0, the loop would never run and the result would be 0.',
        },
        { line: 2, vars: { n: 4, total: 0, i: 1 }, note: '`i` starts at 1. Since 1 is at most 4, the loop body runs.' },
        { line: 3, vars: { n: 4, total: 0, i: 1 }, note: 'Add 1: the total goes from 0 to 1.' },
        { line: 2, vars: { n: 4, total: 1, i: 2 }, note: '`i` is now 2. It is still at most 4, so the body runs again.' },
        { line: 3, vars: { n: 4, total: 1, i: 2 }, note: 'Add 2: the total goes from 1 to 3.' },
        { line: 3, vars: { n: 4, total: 3, i: 3 }, note: '`i` is now 3. Add 3: the total goes from 3 to 6.' },
        { line: 3, vars: { n: 4, total: 6, i: 4 }, note: '`i` is now 4. Add 4: the total goes from 6 to 10.' },
        { line: 2, vars: { n: 4, total: 10, i: 5 }, note: '`i` is 5, which is more than 4, so the loop stops.' },
        { line: 5, vars: { n: 4, total: 10, result: 10 }, note: 'Return the total, 10.' },
      ],
    },
    reasoning:
      'The total is the sum of the values already visited. It starts at zero, so the empty range is correct, and each pass adds the next value until `i` passes `n`.',
    trace:
      'For `n = 4` the total becomes 1, 3, 6, and 10 as `i` takes 1, 2, 3, and 4. For `n = 0` the condition `1 <= 0` is `false`, so the loop never runs and 0 is returned.',
    alternative:
      'The formula `n * (n + 1) / 2` returns the same result without visiting each value. The loop is easier to change when the rule adds only selected values.',
    counterexample: 'Using `i < n` omits `n`. For `n = 4` it returns 6 instead of 10.',
    transfer: 'Sum only the odd numbers from 1 through `n`. Decide the starting value and the step size before you write the loop body.',
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
        { line: 5, vars: { value: 4, steps: 0 }, note: '9 halved and rounded down is 4. Count this step: `steps` goes from 0 to 1.' },
        { line: 3, vars: { value: 4, steps: 1 }, note: '4 is more than 1, so the loop runs again.' },
        { line: 5, vars: { value: 2, steps: 1 }, note: '4 halved is 2. Count this step: `steps` goes from 1 to 2.' },
        { line: 3, vars: { value: 2, steps: 2 }, note: '2 is more than 1, so one more halving is needed.' },
        { line: 5, vars: { value: 1, steps: 2 }, note: '2 halved is 1. Count this step: `steps` goes from 2 to 3.' },
        { line: 3, vars: { value: 1, steps: 3 }, note: '1 is not more than 1, so the loop stops.' },
        { line: 7, vars: { value: 1, steps: 3, result: 3 }, note: 'Return the step count, 3.' },
      ],
    },
    reasoning:
      'The loop tests the current value before each halving. When the value reaches 1 no further halving is needed, so the count equals the number of halvings performed.',
    trace:
      'Starting with 9, the value is greater than 1, so it becomes 4 and `steps` becomes 1. Then 4 becomes 2 and `steps` becomes 2. Then 2 becomes 1 and `steps` becomes 3. The value 1 fails the condition, so the result is 3.',
    alternative:
      'A `for` loop with a manual `break` can work, but the `while` condition states the stopping rule directly. Bit operations count bit length, but they hide the halving rule this rep asks you to practice.',
    counterexample:
      'Using `value / 2` without `Math.floor` gives 9 four steps: 4.5, 2.25, 1.125, and 0.5625. The value stays fractional, so the count is wrong.',
    transfer:
      'Repeat the halving rule until the value is 0 instead. Explain why an input of `-1` never reaches 0 under floor division, and what this means for the loop.',
  },
  'string-basics': {
    traceSteps: {
      code: [
        'function initials(fullName: string): string {',
        "  const words = fullName.trim().split(' ')",
        "  let result = ''",
        '  for (let i = 0; i < words.length; i++) {',
        '    result += words[i].slice(0, 1).toUpperCase()',
        '  }',
        '  return result',
        '}',
      ],
      input: "fullName = ' ada  lovelace'",
      steps: [
        {
          line: 1,
          vars: {},
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'] },
          note: '`trim` drops the leading space. `split` at each space gives three pieces: the two spaces between the words leave an empty piece, `""`.',
        },
        {
          line: 2,
          vars: { result: '' },
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'] },
          note: 'The result starts as empty text. No piece has been read yet.',
        },
        {
          line: 4,
          vars: { i: 0, result: 'A' },
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'], pointers: { i: 0 } },
          note: 'Piece 0 is `ada`. Its first character, uppercased, is `A`, so the result becomes `A`.',
        },
        {
          line: 4,
          vars: { i: 1, result: 'A' },
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'], pointers: { i: 1 }, dimmed: [0] },
          note: 'Piece 1 is empty. `slice(0, 1)` gives empty text, so the result stays `A` and nothing breaks.',
        },
        {
          line: 4,
          vars: { i: 2, result: 'AL' },
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'], pointers: { i: 2 }, dimmed: [0, 1] },
          note: 'Piece 2 is `lovelace`. Its first character, uppercased, is `L`, so the result becomes `AL`.',
        },
        {
          line: 3,
          vars: { i: 3, result: 'AL' },
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'], dimmed: [0, 1, 2] },
          note: '`i` is 3, which is not less than the 3 pieces, so the loop stops.',
        },
        {
          line: 6,
          vars: { result: 'AL' },
          structure: { kind: 'array', values: ['ada', '""', 'lovelace'], dimmed: [0, 1, 2] },
          note: 'Return `AL`: the same answer as the example, even with the extra spaces.',
        },
      ],
    },
    reasoning:
      'Splitting at single spaces can leave empty pieces, but `slice(0, 1)` turns each of them into empty text, so they add nothing. Only real words contribute a letter, and an empty or blank name gives an empty result without a special case.',
    trace:
      'For the example `ada lovelace` the pieces are `ada` and `lovelace`, giving `A` and then `AL`. For `grace   hopper` the pieces are `grace`, `""`, `""`, and `hopper`; the empty pieces add nothing, so the result is `GH`. For a name of only spaces, `trim` leaves `""`, which splits into one empty piece, so the result is empty.',
    alternative:
      'Splitting on runs of spaces with `split(/\\s+/)` after trimming gives only real words, except that an empty name still gives one empty piece. A regular expression that matches the start of each word can collect initials in one step, but it is harder to trace.',
    counterexample:
      'Reading `word[0].toUpperCase()` instead of slicing throws on an empty piece, because `word[0]` is `undefined` there: `grace   hopper` fails with an error. Joining the letters with a space returns `A L` instead of `AL`.',
    transfer:
      'Return the first letter of the first and last words only. Decide what a one-word name should return before you change the code. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'object-update': {
    traceSteps: {
      code: [
        'type Task = { title: string; done: boolean; priority: number }',
        'function setDone(task: Task, done: boolean): Task {',
        '  const updated: Task = { ...task, done }',
        '  return updated',
        '}',
      ],
      input: "task = { title: 'Write', done: false, priority: 2 }, done = true",
      steps: [
        {
          line: 1,
          vars: { done: true },
          structure: {
            kind: 'state',
            entries: [
              ['task.title', 'Write'],
              ['task.done', false],
              ['task.priority', 2],
              ['updated', 'not made yet'],
            ],
          },
          note: 'The function receives the task and the requested value `true`. The task must look the same when the function returns.',
        },
        {
          line: 2,
          vars: { done: true },
          structure: {
            kind: 'state',
            entries: [
              ['task.title', 'Write'],
              ['task.done', false],
              ['task.priority', 2],
              ['updated.title', 'Write'],
            ],
          },
          note: 'The spread starts a new object and copies the first field, `title`.',
        },
        {
          line: 2,
          vars: { done: true },
          structure: {
            kind: 'state',
            entries: [
              ['task.title', 'Write'],
              ['task.done', false],
              ['task.priority', 2],
              ['updated.title', 'Write'],
              ['updated.done', false],
            ],
          },
          note: 'It copies `done` as it is in the task: `false` for now.',
        },
        {
          line: 2,
          vars: { done: true },
          structure: {
            kind: 'state',
            entries: [
              ['task.title', 'Write'],
              ['task.done', false],
              ['task.priority', 2],
              ['updated.title', 'Write'],
              ['updated.done', false],
              ['updated.priority', 2],
            ],
          },
          note: 'It copies `priority`. The new object now matches the task field for field.',
        },
        {
          line: 2,
          vars: { done: true },
          structure: {
            kind: 'state',
            entries: [
              ['task.title', 'Write'],
              ['task.done', false],
              ['task.priority', 2],
              ['updated.title', 'Write'],
              ['updated.done', true],
              ['updated.priority', 2],
            ],
          },
          note: '`done` is listed after the spread, so it replaces the copied `false` with `true`. Only the new object changes.',
        },
        {
          line: 3,
          vars: { done: true, result: '{"title": "Write", "done": true, "priority": 2}' },
          structure: {
            kind: 'state',
            entries: [
              ['task.title', 'Write'],
              ['task.done', false],
              ['task.priority', 2],
              ['updated.title', 'Write'],
              ['updated.done', true],
              ['updated.priority', 2],
            ],
          },
          note: 'Return the new object. The task still has `done` `false`, so the caller sees no surprise.',
        },
      ],
    },
    reasoning:
      'The caller keeps its original task. Returning a new object makes the change explicit, and code that still holds the old value sees no surprise.',
    trace:
      "For `{ title: 'Write', done: false, priority: 2 }` with `done` `true`, the spread copies `title` and `priority`, then `done` replaces `false`. The supplied object still has `done` `false` afterward.",
    alternative:
      "`Object.assign({}, task, { done })` gives the same result and is more verbose. Assigning `task.done` directly is shorter but changes the caller's object.",
    counterexample:
      '`task.done = done; return task` returns the right value, but the supplied object changed, which the input check reports. `{ ...task, done: !task.done }` flips the flag instead of setting it, so a task that is already done gets reopened.',
    transfer:
      'Update one field inside a nested settings object. Explain why one spread is no longer enough and which nested objects must be copied.',
  },
  'shipping-cost-tiers': {
    traceSteps: {
      code: [
        'type Line = { weightGrams: number; quantity: number }',
        'function shippingCost(lines: Line[]): number {',
        '  if (lines.length === 0) return 0',
        '  let total = 0',
        '  let bulky = false',
        '  for (const line of lines) {',
        '    total += line.weightGrams * line.quantity',
        '    if (line.quantity > 10) bulky = true',
        '  }',
        '  const base = total <= 500 ? 300 : total <= 2000 ? 600 : 1200',
        '  return bulky ? base + 200 : base',
        '}',
      ],
      input: 'lines = [{ weightGrams: 300, quantity: 2 }, { weightGrams: 150, quantity: 1 }]',
      steps: [
        {
          line: 4,
          vars: { total: 0, bulky: false },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'] },
          note: 'The order has two lines, so it is not empty. The total starts at 0 grams and the `bulky` flag starts `false`.',
        },
        {
          line: 6,
          vars: { total: 600, bulky: false },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'], pointers: { line: 0 } },
          note: '300 grams times a quantity of 2 adds 600 grams.',
        },
        {
          line: 7,
          vars: { quantity: 2, bulky: false },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'], pointers: { line: 0 } },
          note: 'A quantity of 2 is not above 10, so the flag stays `false`.',
        },
        {
          line: 6,
          vars: { total: 750, bulky: false },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'], pointers: { line: 1 }, dimmed: [0] },
          note: '150 grams times 1 adds 150, so the total is 750 grams.',
        },
        {
          line: 7,
          vars: { quantity: 1, bulky: false },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'], pointers: { line: 1 }, dimmed: [0] },
          note: 'A quantity of 1 is not bulky either. Both facts are now known for the whole order.',
        },
        {
          line: 9,
          vars: { total: 750, base: 600 },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'], dimmed: [0, 1] },
          note: '750 is above 500 and at most 2000, so the middle tier applies: 600 cents.',
        },
        {
          line: 10,
          vars: { base: 600, bulky: false, result: 600 },
          structure: { kind: 'array', values: ['300 g × 2', '150 g × 1'], dimmed: [0, 1] },
          note: 'No line was bulky, so no handling charge is added. Return 600.',
        },
      ],
    },
    reasoning:
      'The loop only gathers two facts, the total weight and whether any line is bulky. The tier is chosen once from the total, and the handling charge is added once from the flag, so each fact is decided after the loop has seen every line.',
    trace:
      'In the example, 300 × 2 + 150 × 1 = 750 grams, which is above 500 and at most 2000, so the base is 600; neither quantity is above 10, so the cost is 600. Exactly 500 grams, as in 100 × 1 + 200 × 2, stays at 300 because the light tier includes its edge. Lines 1000g x 3 and 5g x 11 total 3055 grams, so the base is 1200, and the second line is bulky, so 200 is added once for 1400.',
    alternative:
      'Adding the handling charge inside the loop is shorter to type but charges once per bulky line. Choosing the tier per line would price each line as its own shipment, which changes the contract.',
    counterexample:
      'Returning 300 for an empty order treats no items as the lightest parcel. Testing `total < 500` moves exactly 500 grams into the middle tier. Adding up the quantities of every line before comparing with 10 charges two lines of 6, though neither line is bulky on its own.',
    transfer:
      'Add a surcharge for lines heavier than 1000 grams each, charged once per line. Decide whether the surcharge is per line or per order before coding. This changed contract is self-reviewed, not checked by the original cases.',
  },
  'countdown-labels': {
    traceSteps: {
      code: [
        'function countdownLabels(startSeconds: number, stepSeconds: number): string[] {',
        '  const labels: string[] = []',
        '  for (let value = startSeconds; value >= 0; value -= stepSeconds) {',
        '    const minutes = Math.floor(value / 60)',
        '    const seconds = value % 60',
        "    labels.push(`${minutes}:${String(seconds).padStart(2, '0')}`)",
        '  }',
        '  return labels',
        '}',
      ],
      input: 'startSeconds = 130, stepSeconds = 60',
      steps: [
        {
          line: 2,
          vars: { value: 130 },
          structure: { kind: 'array', values: [] },
          note: 'The first value is `startSeconds`, 130. It is 0 or more, so it gets a label.',
        },
        {
          line: 4,
          vars: { value: 130, minutes: 2, seconds: 10 },
          structure: { kind: 'array', values: [] },
          note: '130 is 2 whole minutes (120 seconds) with 10 seconds left over.',
        },
        {
          line: 5,
          vars: { value: 130, label: '2:10' },
          structure: { kind: 'array', values: ['2:10'] },
          note: 'Minutes stay as they are; seconds are padded to two digits. The label is `2:10`.',
        },
        {
          line: 5,
          vars: { value: 70, minutes: 1, seconds: 10, label: '1:10' },
          structure: { kind: 'array', values: ['2:10', '1:10'] },
          note: 'Subtract 60: 70 is 1 minute and 10 seconds, so the label is `1:10`.',
        },
        {
          line: 5,
          vars: { value: 10, minutes: 0, seconds: 10, label: '0:10' },
          structure: { kind: 'array', values: ['2:10', '1:10', '0:10'] },
          note: 'Subtract 60 again: 10 is 0 minutes and 10 seconds. Minutes are not padded, so the label is `0:10`.',
        },
        {
          line: 2,
          vars: { value: -50 },
          structure: { kind: 'array', values: ['2:10', '1:10', '0:10'] },
          note: 'The next value, -50, is below 0, so the loop stops before labeling it.',
        },
        {
          line: 7,
          vars: { result: '["2:10","1:10","0:10"]' },
          structure: { kind: 'array', values: ['2:10', '1:10', '0:10'] },
          note: 'Return the three labels in countdown order.',
        },
      ],
    },
    reasoning:
      'The value itself is the loop state. Looping while the value is at least zero means the last label is the last non-negative value the countdown reaches, and formatting is a separate step applied to each value.',
    trace:
      'Start 130 with step 60: values 130, 70, 10 are labeled `2:10`, `1:10`, `0:10`. The next value, -50, fails the test and stops the loop. Start 120 with step 60 reaches 0 exactly, so `0:00` appears.',
    alternative:
      'Counting the number of labels first and then computing each value is also correct, but it adds a division that the countdown does not need. A `while` loop with the same condition reads the same way.',
    counterexample:
      'Using `value > 0` drops the `0:00` label for starts that land exactly on zero. Padding minutes as well as seconds turns `2:10` into `02:10`, which the format does not ask for.',
    transfer:
      'Count up from zero to a limit in steps and format each value as `h:mm:ss`. Decide the stop condition and how hours appear before coding. This changed contract is self-reviewed, not checked by the original cases.',
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
      'The greeting never changes, so I write const greeting = "Hello, " with its trailing space. message changes once, so it is a let: it starts as greeting, then message = message + name adds the name. I return message. The checks verify the output, while I review the declarations myself.',
  },
  'basic-types': {
    plan: ['Identify the string, number, and boolean inputs.', 'Match the punctuation and spacing in the example.'],
    explanation: ['Explain how each value becomes part of the sentence.', 'Show that false and zero are preserved.'],
    example:
      'I return `${name} is ${age}. Active: ${active}`, one template string with all three inputs. False and zero are values to display, not reasons to skip a field.',
  },
  'create-objects': {
    plan: ['Create a person with both supplied properties.', 'Read the properties to build the sentence.'],
    explanation: [
      'Review your object and Person type yourself; output checks cannot prove their use.',
      'Explain the difference between a property and a local variable.',
    ],
    example:
      'I create const person: Person = { name, age }, then return `${person.name} is ${person.age} years old`. The sentence checks do not prove that I used an object or checked its type.',
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
      'I trim the name and split it at spaces. Repeated spaces leave empty pieces, but slice(0, 1) turns them into empty text, so only real words add a letter. I uppercase each first letter and add it to the result. An empty name gives one empty piece, so the result is an empty string. The checks verify the output; I review the splitting rule myself.',
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
