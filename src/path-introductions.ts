import type { PathId, PathIntroduction } from './path.ts'

// Each track's opening explanation. Only the All tracks page shows these, so they load with it rather than at startup.
export const pathIntroductions: Record<PathId, PathIntroduction> = {
  typescript: {
    title: 'A gentle start with TypeScript',
    body: 'A program is a set of instructions for working with information. TypeScript lets you name values, combine them in functions, and describe the kinds of values you expect. You can start here without knowing the syntax yet.',
    example: 'const name = "Ada"\nfunction greet(person: string): string {\n  return "Hello, " + person\n}\ngreet(name) // "Hello, Ada"',
    explanation:
      'The first line saves a text value. The function takes text and returns a greeting. The last line calls it with the saved name.',
    next: 'First, try a tiny rep that creates a greeting. Read the example, make a plan in your own words, and use the checks to learn from mistakes.',
  },
  'algorithms-data-structures': {
    title: 'Learn the tools, then solve the problem',
    body: 'A data structure organizes values. An algorithm is a set of steps for working with them. You will learn both together here. Do Foundations first, or be ready to write a TypeScript function. Read "Use collections before solving problems" in Lessons before the first stage, "Stack and queue operations" before stacks, and "Two pointers, windows, and binary search" before the techniques.',
    example:
      'const waiting: number[] = [4, 7]\nwaiting.push(9) // add at the back\nwaiting.shift() // serve 4 first\nwaiting[0] // next is 7',
    explanation:
      'This array acts like a queue: the earliest arrival leaves first. A stack removes the latest arrival instead. Trace a few operations before you choose a structure.',
    next: 'Start with collection operations. After each rep, say what happens with empty input and who owns the data. Stages that reuse Foundations reps link back instead of repeating them.',
  },
  'pattern-recognition': {
    title: 'See the shape, then solve the problem',
    body: 'Knowing a technique is different from recognizing when to use it. Read "Recognize the pattern" in Lessons before "Name the pattern first". Review the prerequisite Problem solving lessons when a tool is unfamiliar. These reps reuse existing tasks and completion evidence; they do not create a new independent or retained assessment.',
    example:
      '// Before coding, write:\n// What must the result answer?\n// Which input facts make my approach safe?\n// What small example would break another approach?',
    explanation:
      'Choose from the contract rather than a stage label. A useful plan names a candidate, the fact that supports it, and a boundary that could disprove it.',
    next: 'Read the lesson, then name your candidate before solving the first rep. In the mixed practice, decide which tool fits before you code. Existing rep titles and hints remain available, so this is introductory recognition practice rather than a blind assessment.',
  },
  frontend: {
    title: 'From data to what a person sees',
    body: 'A frontend reads data and decides what to show. Is it loading? Did it fail? Is it empty? You will practice those small decisions first, then handle timing, requests, and live updates. Foundations first helps, especially objects, arrays, and functions.',
    example:
      "type State = {status: 'pending'} | {status: 'ready'; titles: string[]}\nconst items = [{ label: 'Ada', active: true }]\nconst visible = items.filter(item => item.active)",
    explanation:
      'The tag tells you which fields exist. The filter keeps only active items, and the result can be recalculated whenever the data changes.',
    next: 'Start with state labels, then derive what the screen shows. Return to the recall reps after three days. When you are ready, build the team directory project on your own.',
  },
  backend: {
    title: 'From a request to a trustworthy result',
    body: 'A backend receives input, checks it, does work, and returns a result. TypeScript describes a value, but data from outside still needs a runtime check. Foundations first helps, especially objects, arrays, and functions.',
    example: 'const input: unknown = { name: "Ada" }\n// Check its shape before reading input.name.',
    explanation: '"Unknown" means nobody has verified the value yet. A type assertion would not check what actually arrived.',
    next: 'Begin with validation, then paging and handlers. Reliability reps come next: caches, retries, and shared resources. Finish with the ticket API project.',
  },
  sql: {
    title: 'Ask questions of stored data',
    body: 'A database keeps information in tables of rows and columns. SQL is the language for reading and changing them: you describe the result you want, and the database works out how to produce it. Here you write SQL directly, and every check runs it on a fresh SQLite database. You can start without Foundations.',
    example: 'SELECT title, author\nFROM books\nWHERE year < 1980\nORDER BY year;',
    explanation:
      'FROM names the table to read. WHERE keeps only the rows that match. SELECT chooses the columns, and ORDER BY sorts the result.',
    next: 'Start by choosing columns from one table. A failed check shows your rows beside the expected rows, so run early and compare.',
  },
}
