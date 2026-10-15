import { lines } from './rep-helpers.ts'
import type { Rep } from './rep-types.ts'

// Debugging in fresh contexts: an inclusive date filter (guided), money in floating point (independent), a reducer
// that changes the state it was given (recall), and closures that all share one loop variable (practice).
// Each starter is the faulty code from the bug report; checks establish the repaired behavior only.

const dateRangeStarter = lines(
  'type Order = { id: string; date: string }',
  '',
  'function ordersInRange(orders: Order[], from: string, to: string): string[] {',
  '  const result: string[] = []',
  '  for (let i = 1; i < orders.length; i++) {',
  '    const order = orders[i]',
  '    if (order.date > from && order.date < to) result.push(order.id)',
  '  }',
  '  return result',
  '}',
)

const invoiceStarter = lines(
  'type Line = { price: number; quantity: number }',
  '',
  'function invoiceCents(lines: Line[], taxPercent: number): number {',
  '  let total = 0',
  '  for (const line of lines) total += line.price * line.quantity',
  '  total = total * (1 + taxPercent / 100)',
  '  return Math.floor(total * 100)',
  '}',
)

const reducerStarter = lines(
  'type State = { items: string[]; selected: string | null }',
  'type Action =',
  "  | { type: 'add'; item: string }",
  "  | { type: 'remove'; item: string }",
  "  | { type: 'select'; item: string }",
  "  | { type: 'clear' }",
  '',
  'function applyAction(state: State, action: Action): State {',
  '  switch (action.type) {',
  "    case 'add':",
  '      if (!state.items.includes(action.item)) state.items.push(action.item)',
  '      return state',
  "    case 'remove':",
  '      state.items = state.items.filter(item => item !== action.item)',
  '      if (state.selected === action.item) state.selected = null',
  '      return state',
  "    case 'select':",
  '      return state.items.includes(action.item) ? { ...state, selected: action.item } : state',
  "    case 'clear':",
  '      return { items: [], selected: null }',
  '  }',
  '  return state',
  '}',
)

const handlersStarter = lines(
  'function handlerLabels(labels: string[], clicks: number[]): string[] {',
  '  const handlers: (() => string)[] = []',
  '  for (var i = 0; i < labels.length; i++) {',
  "    handlers.push(() => labels[i] + ' (button ' + (i + 1) + ')')",
  '  }',
  '  return clicks.map(index => handlers[index]())',
  '}',
)

const state = (items: string[], selected: string | null = null) => ({ items, selected })

export const debugReps: Rep[] = [
  {
    id: 'debug-date-range-filter',
    title: 'Repair a date range filter',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report: “Orders placed on the last day of the range are missing. A range that starts and ends on the same day shows nothing. And the first order in the list never appears, whatever its date.” Reproduce each sentence before you edit.',
    prompt:
      'Repair ordersInRange. Return the ids of the orders whose date is on or after from and on or before to, in input order. When from is later than to, return []. Do not change orders.',
    example: {
      input: "ordersInRange([{ id: 'a', date: '2026-03-01' }, { id: 'b', date: '2026-03-31' }], '2026-03-01', '2026-03-31')",
      output: "['a', 'b']",
    },
    note: 'Every date, including from and to, is a valid YYYY-MM-DD string with zero-padded month and day, so comparing the strings compares the dates. orders has 0 to 1000 entries.',
    vocabulary: [
      { term: 'Inclusive range', meaning: 'a range that contains both of its end values' },
      { term: 'Off-by-one error', meaning: 'a mistake where a boundary or count is one too high or too low' },
      { term: 'Zero-padded', meaning: 'written with leading zeros, such as 03 instead of 3' },
    ],
    planPrompt:
      'For each sentence of the bug report, write one input that reproduces it and the line you suspect. Why does comparing these date strings work at all?',
    starter: dateRangeStarter,
    functionName: 'ordersInRange',
    preserveInput: true,
    hints: [
      'There are three separate faults: one in the loop and two in the condition. Each sentence of the report points at one.',
      'An order dated exactly from or exactly to belongs in the result, so both comparisons must include equality.',
      'Start the loop at the first index. Use >= from and <= to; a from later than to then matches nothing on its own.',
    ],
    checks: [
      {
        name: 'Includes the last day of the range',
        input: [
          [
            { id: 'a', date: '2026-03-15' },
            { id: 'b', date: '2026-03-31' },
          ],
          '2026-03-01',
          '2026-03-31',
        ],
        expected: ['a', 'b'],
      },
      {
        name: 'Includes the first day of the range',
        input: [[{ id: 'a', date: '2026-03-01' }], '2026-03-01', '2026-03-31'],
        expected: ['a'],
      },
      {
        name: 'A one-day range',
        input: [
          [
            { id: 'a', date: '2026-04-09' },
            { id: 'b', date: '2026-04-10' },
            { id: 'c', date: '2026-04-11' },
          ],
          '2026-04-10',
          '2026-04-10',
        ],
        expected: ['b'],
      },
      {
        name: 'The first order in the list is checked',
        input: [
          [
            { id: 'first', date: '2026-05-05' },
            { id: 'second', date: '2026-07-01' },
          ],
          '2026-05-01',
          '2026-05-31',
        ],
        expected: ['first'],
      },
      {
        name: 'Excludes dates on both sides',
        input: [
          [
            { id: 'early', date: '2026-02-28' },
            { id: 'in', date: '2026-03-02' },
            { id: 'late', date: '2026-04-01' },
          ],
          '2026-03-01',
          '2026-03-31',
        ],
        expected: ['in'],
      },
      {
        name: 'Range across a new year',
        input: [
          [
            { id: 'eve', date: '2025-12-31' },
            { id: 'day', date: '2026-01-01' },
          ],
          '2025-12-31',
          '2026-01-01',
        ],
        expected: ['eve', 'day'],
      },
      { name: 'From later than to', input: [[{ id: 'a', date: '2026-03-10' }], '2026-03-31', '2026-03-01'], expected: [] },
      { name: 'No orders', input: [[], '2026-01-01', '2026-12-31'], expected: [] },
    ],
  },
  {
    id: 'debug-invoice-rounding',
    title: 'Repair a total that loses a cent',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report: “An item priced $4.35 invoices as $4.34. A $0.57 item invoices as $0.56. A $19.99 item with 8% tax shows $21.58, but our accountant gets $21.59.” Most other totals look right, which is why the bug survived.',
    prompt:
      'Repair invoiceCents. Prices are in dollars with at most two decimal places. Work out each line’s amount in whole cents, add them into a subtotal, then add tax: taxPercent of the subtotal, rounded to the nearest cent, with exact halves rounded up. Return the total as a whole number of cents. Do not change lines.',
    example: { input: 'invoiceCents([{ price: 4.35, quantity: 1 }], 0)', output: '435' },
    note: 'price is from 0 to 10000 with at most two decimal places; quantity is an integer from 0 to 1000; taxPercent is an integer from 0 to 25. There are 0 to 100 lines. An empty invoice totals 0.',
    vocabulary: [
      { term: 'Floating point', meaning: 'the binary number format JavaScript uses, which cannot store most decimal fractions exactly' },
      { term: 'Whole cents', meaning: 'money stored as an integer number of cents, so 4.35 dollars is 435' },
      { term: 'Round half up', meaning: 'round to the nearest whole number, moving an exact .5 upward' },
    ],
    planPrompt:
      'Run the starter on the three reported prices and write the exact values you see before rounding. Which step turns a tiny error into a lost cent?',
    starter: invoiceStarter,
    functionName: 'invoiceCents',
    preserveInput: true,
    hints: [
      'Print 4.35 * 100 in the console. The value is a tiny bit below 435, and Math.floor turns that into a whole cent lost.',
      'Convert each price to whole cents as early as possible, rounding away the tiny error, and do the remaining arithmetic on integers.',
      'Use Math.round(price * 100) for each price, multiply by quantity, sum, then add Math.round(subtotal * taxPercent / 100).',
    ],
    checks: [
      { name: 'A price just below a whole cent in binary', input: [[{ price: 4.35, quantity: 1 }], 0], expected: 435 },
      { name: 'Another reported price', input: [[{ price: 0.57, quantity: 1 }], 0], expected: 57 },
      { name: 'Tax on the reported item', input: [[{ price: 19.99, quantity: 1 }], 8], expected: 2159 },
      {
        name: 'Several lines and quantities',
        input: [
          [
            { price: 0.1, quantity: 3 },
            { price: 0.2, quantity: 1 },
            { price: 1.15, quantity: 3 },
          ],
          0,
        ],
        expected: 395,
      },
      { name: 'Tax that lands exactly on half a cent rounds up', input: [[{ price: 0.5, quantity: 1 }], 25], expected: 63 },
      { name: 'Half a cent of tax after several units', input: [[{ price: 0.06, quantity: 3 }], 25], expected: 23 },
      { name: 'Zero quantity adds nothing', input: [[{ price: 9.99, quantity: 0 }], 10], expected: 0 },
      { name: 'Empty invoice', input: [[], 20], expected: 0 },
      { name: 'Free item', input: [[{ price: 0, quantity: 5 }], 10], expected: 0 },
      { name: 'Large order', input: [[{ price: 9999.99, quantity: 1000 }], 25], expected: 1249998750 },
    ],
  },
  {
    id: 'debug-reducer-mutation',
    title: 'Repair a reducer that breaks undo',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report: “After adding an item, Undo restores a list that already contains the new item. Removing an item and pressing Undo does the same.” The app keeps every earlier state in a history array and shows one of them on Undo.',
    prompt:
      'Repair applyAction. Return the next state without changing the state you were given or its items array, because the history still refers to them. add appends the item unless it is already present. remove removes every equal item and clears selected when it was that item. select sets selected when the item is present and otherwise leaves the state as it was. clear empties items and clears selected.',
    example: {
      input: "applyAction({ items: ['milk'], selected: null }, { type: 'add', item: 'eggs' })",
      output: "{ items: ['milk', 'eggs'], selected: null }, and the given state still holds only milk",
    },
    note: 'state.items has 0 to 100 nonempty strings with no duplicates; selected is null or one of them. action.item is a nonempty string. Checks compare the returned state and detect any change to the state you received.',
    vocabulary: [
      { term: 'Reducer', meaning: 'a function that takes the current state and an action and returns the next state' },
      { term: 'Mutation', meaning: 'changing an existing object or array in place' },
      { term: 'History', meaning: 'the list of earlier states an app keeps so it can undo' },
    ],
    planPrompt:
      'Which lines change the state they were given? For add and remove, predict what an earlier history entry shows after the starter runs.',
    starter: reducerStarter,
    functionName: 'applyAction',
    preserveInput: true,
    hints: [
      'push and assigning to a property both change an object the history still holds.',
      'Each branch that changes something must build a new state object and, when items change, a new items array.',
      'Return { ...state, items: [...state.items, item] } for a new item, and a new object with the filtered items and the updated selected for remove. Returning the same state is fine when nothing changes.',
    ],
    checks: [
      {
        name: 'Adds without changing the history entry',
        input: [state(['milk']), { type: 'add', item: 'eggs' }],
        expected: state(['milk', 'eggs']),
      },
      {
        name: 'Adding an existing item changes nothing',
        input: [state(['milk'], 'milk'), { type: 'add', item: 'milk' }],
        expected: state(['milk'], 'milk'),
      },
      {
        name: 'Removes and clears the selection',
        input: [state(['milk', 'eggs'], 'eggs'), { type: 'remove', item: 'eggs' }],
        expected: state(['milk']),
      },
      {
        name: 'Removing another item keeps the selection',
        input: [state(['milk', 'eggs'], 'milk'), { type: 'remove', item: 'eggs' }],
        expected: state(['milk'], 'milk'),
      },
      {
        name: 'Removing a missing item changes nothing',
        input: [state(['milk']), { type: 'remove', item: 'tea' }],
        expected: state(['milk']),
      },
      {
        name: 'Selects a present item',
        input: [state(['milk', 'eggs']), { type: 'select', item: 'eggs' }],
        expected: state(['milk', 'eggs'], 'eggs'),
      },
      {
        name: 'Selecting a missing item changes nothing',
        input: [state(['milk'], 'milk'), { type: 'select', item: 'tea' }],
        expected: state(['milk'], 'milk'),
      },
      { name: 'Clears everything', input: [state(['milk', 'eggs'], 'milk'), { type: 'clear' }], expected: state([]) },
    ],
  },
  {
    id: 'debug-stale-handlers',
    title: 'Repair buttons that all report the last label',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report: “Every toolbar button says undefined (button 4) when clicked, even though there are only three buttons.” The handlers are created in a loop when the toolbar is built and called later, when someone clicks.',
    prompt:
      'Repair handlerLabels. It creates one click handler per label, then calls the handlers for each index in clicks, in order. The handler for the button at index i must return its label followed by " (button i + 1)", for example "Save (button 1)". Return the results in click order. Do not change labels or clicks.',
    example: {
      input: "handlerLabels(['Save', 'Undo', 'Redo'], [1, 0])",
      output: "['Undo (button 2)', 'Save (button 1)']",
    },
    note: 'labels has 0 to 20 nonempty strings. clicks has 0 to 50 valid indices into labels and may repeat them.',
    vocabulary: [
      { term: 'Click handler', meaning: 'a function that runs later, when a button is clicked' },
      { term: 'Captured variable', meaning: 'a variable from outside a function that the function keeps using after it is created' },
    ],
    planPrompt: 'What is the value of i when the first click happens? Explain why every handler sees that same value.',
    starter: handlersStarter,
    functionName: 'handlerLabels',
    preserveInput: true,
    hints: [
      'The handlers run after the loop has finished. Ask what i holds at that moment.',
      'A var declaration creates one variable for the whole function, so every handler captures the same i.',
      'Declare the loop variable with let, which creates a fresh binding on every pass, or copy the index and label into constants inside the loop.',
    ],
    checks: [
      {
        name: 'Each button reports its own label',
        input: [
          ['Save', 'Undo', 'Redo'],
          [0, 1, 2],
        ],
        expected: ['Save (button 1)', 'Undo (button 2)', 'Redo (button 3)'],
      },
      {
        name: 'Clicks in a different order',
        input: [
          ['Save', 'Undo', 'Redo'],
          [2, 0],
        ],
        expected: ['Redo (button 3)', 'Save (button 1)'],
      },
      { name: 'Repeated clicks', input: [['Bold'], [0, 0, 0]], expected: ['Bold (button 1)', 'Bold (button 1)', 'Bold (button 1)'] },
      { name: 'No clicks', input: [['Save'], []], expected: [] },
      { name: 'No buttons', input: [[], []], expected: [] },
    ],
  },
]
