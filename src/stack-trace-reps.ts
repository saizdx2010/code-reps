import type { Rep } from './rep-types.ts'

// Read an error and its stack trace. Each error report is what the starter really throws for the reported input;
// tests/stack-traces.test.mjs reruns the starter to keep the message and frames honest.

const person = (id: string, name: string) => ({ id, name })
const user = (id: string, name: string) => ({ id, name })
const ticket = (id: string, ownerId: string | null) => ({ id, ownerId })

export const stackTraceReps: Rep[] = [
  {
    id: 'stack-trace-missing-field',
    title: 'Follow a stack trace to the failing line',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report from the badge printer: one visitor stopped the whole batch, and no badges printed. The log for the batch `[{id: "12", name: "Plato"}]` shows the error below.',
    errorReport:
      "TypeError: Cannot read properties of undefined (reading '0')\n    at initials (solution.ts:5:46)\n    at solution.ts:9:34\n    at Array.map (<anonymous>)\n    at badgeLabels (solution.ts:9:17)",
    prompt:
      'Repair badgeLabels so it returns one label per person, in order: their initials, a space, then their id. The initials are the first letter of the first word and of the last word of the name, in uppercase. A one-word name gives one letter. Ignore spaces before, after, and between words. A name with no words, such as "" or "   ", gives "?". Do not change the input.',
    brief: {
      summary: 'Return one label per person: initials, a space, then the id. Use the error report to find where the starter fails first.',
      rules: [
        'Split the name into words, ignoring spaces before, after, and between words.',
        'Initials are the first letter of the first word and the first letter of the last word, in uppercase.',
        'A one-word name gives one letter.',
        'A name with no words gives "?".',
        'Return the labels in the input order without changing the input.',
      ],
      edgeCases: ['A one-word name, such as "Plato"', 'Three or more words: use the first and the last', 'An empty or space-only name'],
    },
    example: {
      input: 'badgeLabels([{id: "7", name: "Ada Lovelace"}, {id: "12", name: "Plato"}])',
      output: '["AL 7", "P 12"]',
    },
    note: 'Names contain only English letters and spaces, at most 100 characters. There are at most 100 people, and ids are kept exactly as supplied.',
    vocabulary: [
      { term: 'Stack trace', meaning: 'the list of function calls that were running when an error happened, newest first' },
      { term: 'Frame', meaning: 'one "at" line of a stack trace: a function and the file position it was running' },
      {
        term: 'TypeError',
        meaning: 'an error thrown when a value is not the kind the code expects, such as reading a property of undefined',
      },
    ],
    planPrompt:
      'Which frame threw the error, and which value on that line was undefined? Which input reaches it, and what other names could fail the same way?',
    starter:
      "type Person = { id: string; name: string }\n\nfunction initials(name: string): string {\n  const parts = name.trim().split(' ')\n  return parts[0][0].toUpperCase() + parts[1][0].toUpperCase()\n}\n\nfunction badgeLabels(people: Person[]): string[] {\n  return people.map(person => `${initials(person.name)} ${person.id}`)\n}\n",
    functionName: 'badgeLabels',
    preserveInput: true,
    hints: [
      'The first "at" line is where the error was thrown: line 5, inside initials. Which value on that line can be undefined?',
      'Try the name from the report, "Plato". What does split return, and what is parts[1]? Then try "Grace Brewster Hopper" and "  bell   hooks ".',
      'Split on runs of spaces after trimming, read the first and the last word, and decide what a name with no words returns before reading any letter.',
    ],
    checks: [
      { name: 'One-word name from the error report', input: [[person('12', 'Plato')]], expected: ['P 12'] },
      { name: 'Two-word name', input: [[person('7', 'Ada Lovelace')]], expected: ['AL 7'] },
      { name: 'Uses the last word, not the second', input: [[person('3', 'Grace Brewster Hopper')]], expected: ['GH 3'] },
      { name: 'Ignores extra spaces', input: [[person('9', '  bell   hooks ')]], expected: ['BH 9'] },
      { name: 'Blank and empty names give a question mark', input: [[person('4', '   '), person('5', '')]], expected: ['? 4', '? 5'] },
      {
        name: 'Keeps every person in order',
        input: [[person('b', 'Tim Berners Lee'), person('a', 'Plato'), person('c', 'Ada Lovelace')]],
        expected: ['TL b', 'P a', 'AL c'],
      },
      { name: 'Empty batch', input: [[]], expected: [] },
    ],
  },
  {
    id: 'stack-trace-wrong-caller',
    title: 'Find the caller that passed a bad value',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report from the staff table: the page fails to load for the row `["Engineer", "Ada"]` with column widths `[8, 5]`. The log shows the error below. padCell was reviewed last week and matches its contract.',
    errorReport:
      'RangeError: Invalid count value: -3\n    at String.repeat (<anonymous>)\n    at padCell (solution.ts:2:21)\n    at solution.ts:6:37\n    at Array.map (<anonymous>)\n    at formatRow (solution.ts:6:16)',
    prompt:
      'Repair formatRow so it pads every cell with spaces on the right to the width of its own column, then joins the cells with " | ". widths[i] is the width of column i. padCell is correct for its contract: it is only called with a width at least as long as the text. Return an empty string for an empty row. Do not change the input.',
    brief: {
      summary:
        'Pad each cell to its own column width and join the cells with " | ". The error was thrown inside padCell, which is already correct.',
      rules: [
        'Cell i belongs to column i and is padded with spaces on the right to widths[i] characters.',
        'Join the padded cells with " | ", a space, a vertical bar, and a space.',
        'An empty row returns "".',
        'Keep padCell’s contract: it receives a width at least as long as the text.',
      ],
      edgeCases: ['A cell exactly as long as its column', 'The last column, which also needs padding', 'A row with one cell'],
    },
    example: { input: 'formatRow(["Ada", "Engineer"], [5, 8])', output: '"Ada   | Engineer"' },
    note: 'cells and widths have the same length, at most 20. Each width is a whole number from 1 to 40 and at least as long as its cell. Cells contain printable ASCII characters only.',
    vocabulary: [
      { term: 'Caller', meaning: 'the function that called another one; in a stack trace it is the frame just below' },
      { term: 'RangeError', meaning: 'an error thrown when a number is outside the range an operation allows' },
      { term: 'Right padding', meaning: 'spaces added after text so it fills a fixed width' },
    ],
    planPrompt:
      'The top frame threw the error, but was it given a bad value? Which frame below it chose that value, and which width should "Engineer" have received?',
    starter:
      "function padCell(text: string, width: number): string {\n  return text + ' '.repeat(width - text.length)\n}\n\nfunction formatRow(cells: string[], widths: number[]): string {\n  return cells.map((cell, index) => padCell(cell, widths[index + 1])).join(' | ')\n}\n",
    functionName: 'formatRow',
    preserveInput: true,
    hints: [
      'The top frame, padCell, is where the error was thrown. Is its arithmetic wrong, or was it given a width that breaks its contract?',
      'For the row in the report, which width did padCell receive for "Engineer", and which width belongs to that column?',
      'The repair belongs in the caller: pair each cell with the width at the same position. Changing padCell would hide the crash but keep the wrong widths.',
    ],
    checks: [
      {
        name: 'Row from the error report',
        input: [
          ['Engineer', 'Ada'],
          [8, 5],
        ],
        expected: 'Engineer | Ada  ',
      },
      {
        name: 'Pads each cell to its own column',
        input: [
          ['Ada', 'Engineer'],
          [5, 8],
        ],
        expected: 'Ada   | Engineer',
      },
      {
        name: 'Pads the last column too',
        input: [
          ['a', 'b'],
          [1, 3],
        ],
        expected: 'a | b  ',
      },
      { name: 'One cell', input: [['x'], [4]], expected: 'x   ' },
      {
        name: 'Cells exactly their width',
        input: [
          ['abc', 'de'],
          [3, 2],
        ],
        expected: 'abc | de',
      },
      { name: 'Empty row', input: [[], []], expected: '' },
    ],
  },
  {
    id: 'stack-trace-null-lookup',
    title: 'Handle a missing result the trace does not show',
    category: 'Real-world debugging',
    format: 'debug',
    context:
      'Bug report from the support queue: the ticket list fails when a ticket belongs to someone who has left. findUser is shared by other screens and must keep returning null when nobody matches. The log shows the error below.',
    errorReport:
      "TypeError: Cannot read properties of null (reading 'name')\n    at solution.ts:9:65\n    at Array.map (<anonymous>)\n    at ownerNames (solution.ts:9:18)",
    prompt:
      'Repair ownerNames so it returns, for each ticket in order, the name of the user whose id equals the ticket’s ownerId. Return "Unassigned" when ownerId is null or matches no user. A user’s name is returned exactly, even when it is empty. Keep findUser unchanged. Do not change the input.',
    brief: {
      summary: 'Return each ticket owner’s name in order, or "Unassigned". findUser must keep returning null when nobody matches.',
      rules: [
        'Look up the user whose id equals the ticket’s ownerId.',
        'Return that user’s name exactly, even when it is an empty string.',
        'Return "Unassigned" when ownerId is null or no user has that id.',
        'Keep findUser and its null result unchanged.',
      ],
      edgeCases: ['An ownerId that matches nobody', 'A null ownerId', 'A user whose name is ""'],
    },
    example: {
      input: 'ownerNames([{id: "t1", ownerId: "u1"}, {id: "t2", ownerId: "u9"}], [{id: "u1", name: "Bo"}])',
      output: '["Bo", "Unassigned"]',
    },
    note: 'At most 100 tickets and 100 users. User ids are unique. Ids and names contain printable ASCII characters and are compared exactly, without trimming or case changes.',
    vocabulary: [
      { term: 'Null', meaning: 'a value that means "nothing here", returned on purpose when there is no result' },
      { term: 'Return value', meaning: 'the value a function hands back to its caller when it finishes' },
    ],
    planPrompt:
      'findUser is not in the stack trace. Why not, and where did the null come from? Which inputs make the lookup return null, and what should the caller do then?',
    starter:
      'type User = { id: string; name: string }\ntype Ticket = { id: string; ownerId: string | null }\n\nfunction findUser(users: User[], id: string): User | null {\n  return users.find(user => user.id === id) ?? null\n}\n\nfunction ownerNames(tickets: Ticket[], users: User[]): string[] {\n  return tickets.map(ticket => findUser(users, ticket.ownerId!).name)\n}\n',
    functionName: 'ownerNames',
    preserveInput: true,
    hints: [
      'A function that has already returned is no longer on the stack. Which call on line 9 finished and handed back null? The editor’s red underline under .name says the same thing.',
      'List the inputs that make findUser return null, including a null ownerId.',
      'Keep the lookup’s result in a variable and choose the name or "Unassigned" in the caller; check for null itself rather than for an empty name.',
    ],
    checks: [
      { name: 'Known owner', input: [[ticket('t1', 'u1')], [user('u1', 'Bo')]], expected: ['Bo'] },
      { name: 'Owner who left, from the report', input: [[ticket('t2', 'u9')], [user('u1', 'Bo')]], expected: ['Unassigned'] },
      { name: 'Ticket with no owner', input: [[ticket('t3', null)], [user('u1', 'Bo')]], expected: ['Unassigned'] },
      { name: 'An empty name is still a name', input: [[ticket('t4', 'u2')], [user('u2', '')]], expected: [''] },
      {
        name: 'Keeps ticket order',
        input: [
          [ticket('t1', 'u2'), ticket('t2', null), ticket('t3', 'u1'), ticket('t4', 'u2')],
          [user('u1', 'Bo'), user('u2', 'Ana')],
        ],
        expected: ['Ana', 'Unassigned', 'Bo', 'Ana'],
      },
      { name: 'No tickets', input: [[], [user('u1', 'Bo')]], expected: [] },
      { name: 'No users', input: [[ticket('t1', 'u1')], []], expected: ['Unassigned'] },
    ],
  },
]
