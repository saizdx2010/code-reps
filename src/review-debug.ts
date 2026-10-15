import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const debugDepth: Record<string, RepDepth> = {
  'debug-date-range-filter': {
    reasoning:
      'An inclusive range contains its endpoints, so both comparisons need equality: date >= from and date <= to. The loop must start at index 0 to examine every order. Zero-padded YYYY-MM-DD strings sort the same way as the dates they name, because the most significant part comes first and every part has a fixed width.',
    trace:
      'For a one-day range from 2026-04-10 to 2026-04-10, the starter tests 2026-04-10 > 2026-04-10, which is false, so the order is dropped. With >= and <= it is kept. An order at index 0 never reached the starter’s condition at all.',
    alternative:
      'Converting each date to a Date object or a day number makes the comparison independent of the string format, at the cost of parsing every order and handling time zones correctly. Filtering with orders.filter(...).map(order => order.id) avoids the loop index entirely, which removes the starting-index bug by construction.',
    counterexample:
      'Fixing only the end comparison still drops orders on the first day and the order at index 0. Comparing unpadded dates such as 2026-3-9 and 2026-3-10 as strings puts the 10th first, because the character 1 sorts before 9.',
    transfer:
      'Make the end of the range exclusive, as many APIs do, so a one-day range is from 2026-04-10 to 2026-04-11. Decide which comparison changes and how a caller asks for a single day. This changed contract is self-reviewed.',
  },
  'debug-invoice-rounding': {
    reasoning:
      'Most decimal fractions, such as 4.35, have no exact binary floating-point value, so 4.35 * 100 is 434.99999999999994. Math.floor turns that tiny shortfall into a lost cent. Rounding each price to whole cents removes the error once, and every later step uses exact integer arithmetic. Tax is then rounded once, on the subtotal, as the contract requires.',
    trace:
      'For $19.99 at 8%, the starter multiplies 19.99 by 1.08 to get 21.5892 and floors 2158.92 to 2158. The repair converts 19.99 to 1999 cents, computes 1999 × 8 / 100 = 159.92, rounds the tax to 160, and returns 1999 + 160 = 2159.',
    alternative:
      'Storing prices as integer cents from the start, rather than dollars, removes the conversion step and is the usual fix in real systems. A decimal library gives exact decimal arithmetic for amounts that need more than two places. Using Math.round only at the very end usually works but can still misround amounts that sit near a half cent.',
    counterexample:
      'Replacing Math.floor with Math.round at the end fixes $4.35 but still returns 22 instead of 23 for three $0.06 items at 25% tax: the exact tax is 4.5 cents, but in floating point the total is just below 22.5. Rounding the tax on every line separately can differ from rounding it once on the subtotal. toFixed(2) returns a string and has its own surprises with halves, such as 1.005.',
    transfer:
      'Apply a percentage discount before tax, rounded to the nearest cent. Decide the order of discount, tax, and rounding, and write one case where the order changes the answer. This changed contract is self-reviewed.',
  },
  'debug-reducer-mutation': {
    reasoning:
      'The history keeps references to earlier state objects. push and property assignment change those same objects, so the entry meant to represent the past now shows the future. Returning a new state object, with a new items array whenever items change, leaves every earlier object exactly as it was. Returning the original state when nothing changes is safe, because nothing is modified.',
    trace:
      'Starting from milk, add eggs with the starter: push puts eggs into the array the history also holds, and the same object is returned. The history’s previous entry and the current state are now one object, so Undo shows milk and eggs. The repair returns { items: [milk, eggs] } as a new object and the old entry still reads milk.',
    alternative:
      'A library such as Immer lets you write mutating code against a draft and produces new objects for you. Freezing state with Object.freeze in development makes accidental mutation throw immediately. Deep-cloning the whole state on every action is safe but wasteful, and it breaks the cheap identity checks that tell a view whether anything changed.',
    counterexample:
      'Copying the state object with { ...state } but still calling push on state.items changes the shared array, so undo stays broken. Assigning state.selected = null before spreading changes the history’s object. Returning a new object for an unknown action is harmless for undo but makes every render think something changed.',
    transfer:
      'Add a rename action that changes one item’s text and keeps the selection on the renamed item. Decide which arrays and objects must be new. This changed contract is self-reviewed.',
  },
  'debug-stale-handlers': {
    reasoning:
      'A var declaration creates one i for the whole function. Every handler captures that single variable, and the handlers run only after the loop has finished, when i equals labels.length. let creates a fresh binding of i on each pass of a for loop, so each handler keeps the value from its own pass.',
    trace:
      'With three labels, the loop leaves i at 3. The starter’s handlers all read labels[3], which is undefined, and 3 + 1 = 4, giving undefined (button 4). With let, the first handler keeps i = 0 and returns Save (button 1).',
    alternative:
      'labels.map((label, index) => () => ...) gives each handler its own parameters without any loop variable. Copying the values into const label and const number inside the loop body also works with var, because const is block-scoped. Older code used an immediately invoked function to make a new scope per pass.',
    counterexample:
      'Moving var i outside the loop changes nothing, because it is still one variable. Reading labels[i] when the handler is created but i + 1 when it runs fixes the label and still reports button 4.',
    transfer:
      'The same bug appears with setTimeout inside a loop, or with a React effect that reads a state value captured on an earlier render. Explain which variable is captured in each case and how its value is chosen. This changed contract is self-reviewed.',
  },
}

export const debugGuides: Record<string, ReflectionGuide> = {
  'debug-date-range-filter': {
    plan: [
      'For each sentence of the bug report, write one input that reproduces it and the line you suspect.',
      'Explain why comparing these date strings works at all.',
    ],
    explanation: [
      'Name each fault you found and the check that would have caught it.',
      'Explain why string comparison is safe for these dates and when it would not be.',
      'Name a regression case you would keep for each fault.',
    ],
    example:
      'Three faults: the loop started at index 1, and both comparisons were strict. I start at 0 and use >= from and <= to. Zero-padded dates compare correctly as strings because the year, month, and day each have a fixed width, most significant first.',
  },
  'debug-invoice-rounding': {
    plan: [
      'Run the starter on the three reported prices and write the exact values you see before rounding.',
      'Name the step that turns a tiny error into a lost cent.',
    ],
    explanation: [
      'Explain where the floating-point error comes from and why Math.floor makes it visible.',
      'Explain where your code rounds, and why the tax is rounded once on the subtotal.',
      'Name a case that would still fail if you only changed the final rounding.',
    ],
    example:
      '4.35 * 100 is 434.99999999999994, and Math.floor drops it to 434. I convert each price to whole cents with Math.round first, multiply by quantity, sum the integers, then add Math.round(subtotal * taxPercent / 100). Only integers are added after the first rounding.',
  },
  'debug-reducer-mutation': {
    plan: [
      'Which lines change the state they were given?',
      'For add and remove, predict what an earlier history entry shows after the starter runs.',
    ],
    explanation: [
      'Explain why changing the given state breaks undo even though the returned state looks right.',
      'Explain which branches create new objects and which may return the original state.',
      'Name a check that would catch a reintroduced mutation.',
    ],
    example:
      'add and remove changed state.items and state.selected in place, so the history entry and the new state were the same object. Now add returns a new object with a new array, and remove returns a new object with the filtered array and an updated selection. Branches that change nothing return the state they received.',
  },
  'debug-stale-handlers': {
    plan: ['What is the value of i when the first click happens?', 'Explain why every handler sees that same value.'],
    explanation: [
      'Explain the difference between var and let in a for loop.',
      'Explain when the handlers run compared with when they are created.',
      'Name another place in frontend code where the same capture bug can appear.',
    ],
    example:
      'With var there is one i, and by the time anyone clicks, the loop has set it to 3, so every handler reads labels[3]. I declared the loop variable with let, which gives each pass its own i, so each handler keeps the index it was created with.',
  },
}
