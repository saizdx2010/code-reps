import type { PathId } from './path.ts'

// Track and stage text for the trail. The trail draws its structure from src/path.ts at startup; this text loads just
// after, beside it, so it does not weigh on the initial chunk. Every stage in src/path.ts needs an entry here, keyed by
// its title, and tests/trail.test.mjs names any stage without one.
export type StageText = { description: string; recap: string }

export const trackDescriptions: Record<PathId, string> = {
  typescript: "Learn the language basics, then build confidence with arrays, text, lookups, stacks, and reading other people's code.",
  'algorithms-data-structures': 'Pick the right collection, then use techniques for sorted data and windows.',
  'pattern-recognition': 'Read an unlabeled problem, identify its decisive signals, and explain your choice before coding.',
  frontend: 'Decide what a screen shows, keep async results current, and manage live connections.',
  sql: 'Query a real SQLite database: filter, summarize, join, design tables, and change data safely.',
  backend: 'Turn a raw request into a trustworthy result: route, validate, authorize, store, queue, and limit.',
  devops: 'Read CI output, ship with rollouts and health checks, and keep a service observable.',
}

export const stageTexts: Record<PathId, Readonly<Record<string, StageText>>> = {
  typescript: {
    'Learn the language': {
      description: 'Declare values, use types, create objects and arrays, and write functions.',
      recap: 'You can now declare values, use types, create objects and arrays, and write small functions.',
    },
    'Make decisions and repeat': {
      description: 'Choose between cases, repeat work with loops, shape text, and update objects without changing the original.',
      recap: 'You can now choose between cases, repeat work, shape text, and update objects without changing the original.',
    },
    'Work through arrays': {
      description: 'Scan arrays to total, count, and find values, from guided practice to later recall.',
      recap: 'You can now scan arrays to total, count, and find values.',
    },
    'Count and remember': {
      description: 'Use maps and sets when you need to look something up again.',
      recap: 'You can now use maps and sets to remember values and look them up again.',
    },
    'Handle text and gaps': {
      description: 'Think through extra spaces and missing values.',
      recap: 'You can now handle extra spaces in text and find missing values.',
    },
    'Match openings and closings': {
      description: 'Keep track of what is still unmatched with a stack.',
      recap: 'You can now use a stack to match openings and closings.',
    },
    'Calculate shipping on your own': {
      description: 'Use loops and conditions without hints on a fresh pricing problem.',
      recap: 'You can now combine loops and conditions to calculate tiered shipping costs.',
    },
    'Recall in a new setting': {
      description: 'Come back after a break and solve related word, lookup, stack, and countdown problems.',
      recap: 'You can now apply counting, lookups, and stacks in different settings.',
    },
    'Read and repair code': {
      description: "Fix a bug, read a teammate's function, transform data for a screen, and check a suggested answer.",
      recap: 'You can now read unfamiliar code, find bugs, and check a proposed answer.',
    },
    'TypeScript boundaries': {
      description: 'Validate unknown data and preserve types in reusable APIs.',
      recap: 'You can now practice typed boundaries, reviewing compiler guarantees separately from behavior.',
    },
    'How JavaScript runs': {
      description: 'Return a function from a function, then see how closures, shared objects, promises, and the event loop behave.',
      recap: 'You can now return a function from a function and trace closures, shared objects, promises, and event-loop ordering.',
    },
  },
  'algorithms-data-structures': {
    'Use collections': {
      description: 'Practice copying, adding, deleting, overwriting, and reading with arrays, sets, and maps.',
      recap: 'You can now copy, update, and read arrays, sets, and maps.',
    },
    'Apply arrays and text': {
      description: 'Scan values and handle empty input, from guided practice to recall.',
      recap: 'You can now scan arrays and text while handling empty input.',
    },
    'Apply maps and sets': {
      description: 'Use membership and counts, then return later for a different lookup problem.',
      recap: 'You can now use membership and counts to solve lookup problems.',
    },
    'Build and compare text': {
      description: 'Compress repeated characters, group scrambled words, check a palindrome after cleaning, and wrap text to a width.',
      recap: 'You can now scan text in runs, build comparison keys, and normalize text before comparing it.',
    },
    'Stack and queue operations': {
      description: 'Add and remove in both orders, and see how a stack differs from a queue.',
      recap: 'You can now trace stack and queue operations and their different removal orders.',
    },
    'Apply stacks': {
      description: 'Use a stack for nesting, canceling pairs, and simplifying paths.',
      recap: 'You can now use stacks to handle nesting, cancel pairs, and simplify file paths.',
    },
    'Search sorted data and scan windows': {
      description: 'Trace why each move is safe, then try two pointers, fixed and growing windows, and binary search.',
      recap: 'You can now search sorted data and scan windows with clear stopping rules.',
    },
    'Sort and merge': {
      description: 'Build sorted order one value at a time, then merge two sorted lists.',
      recap: 'You can now sort values and merge sorted lists without changing the input.',
    },
    Recursion: {
      description: 'Solve a problem by solving smaller copies of it, starting from the base case.',
      recap: 'You can now break recursive problems into smaller cases with a stopping point.',
    },
    'Trees and graphs': {
      description: 'Find tree depths and paths, then explore graph connections and shortest routes.',
      recap: 'You can now explore trees and graphs to find depths, connections, and routes.',
    },
    'Binary search trees': {
      description:
        'Use the left-smaller, right-larger rule to search one path, insert without changing the original, list a range, find the nearest value, and check the rule itself.',
      recap: 'You can now search, extend, and query a binary search tree along the routes its ordering rule allows.',
    },
    Grids: {
      description: 'Inspect cell boundaries, count connected floor regions, and find a shortest route through walls.',
      recap: 'You can now explore rectangular grids while respecting boundaries and movement rules.',
    },
    'Solve a two-part puzzle': {
      description: 'Interpret a greenhouse log, then adapt its answer to a changed request.',
      recap: 'You can now preserve useful input structure across related requests.',
    },
    'Ranges and linked structures': {
      description:
        'Answer range questions with prefix sums, merge intervals, reverse, insert into, and remove from linked lists, and keep a heap in order.',
      recap: 'You can now answer range queries and work with intervals, linked lists, and heaps.',
    },
    'Rebuild linked lists': {
      description: 'Merge two sorted lists, split a playlist at a track, and rotate a route, creating new nodes each time.',
      recap: 'You can now move several cursors through linked nodes and build new lists without changing the originals.',
    },
    'Heaps and priority queues': {
      description: 'Merge sorted log streams, count the meeting rooms a day needs, and track a live cutoff score.',
      recap: 'You can now recognize when a problem keeps asking for the smallest item and keep that item ready.',
    },
    'Backtracking and dynamic programming': {
      description: 'List every choice with backtracking, then reuse answers to smaller problems.',
      recap: 'You can now explore choices and reuse answers to smaller problems.',
    },
    'Fill tables of smaller answers': {
      description: 'Count routes through a garage, choose stalls for the most revenue, and measure the edits between two tags.',
      recap: 'You can now name a subproblem, write how its answers combine, and fill a table in a safe order.',
    },
    'Harder patterns': {
      description: 'Resolve future readings, rank frequent labels, schedule dependencies, and compare ordered sequences.',
      recap: 'You can now justify approaches for competing order and dependency rules.',
    },
    'Interview round': {
      description: 'Practice clarifying, planning, coding, and explaining in a backend-style interview task.',
      recap: 'You can now clarify, plan, solve, and explain a backend interview task.',
    },
  },
  'pattern-recognition': {
    'Name the pattern first': {
      description: 'Read "Recognize the pattern" in Lessons, then justify a candidate using the input contract before coding.',
      recap: 'You can now justify a candidate from the input contract before coding.',
    },
    'Decide which tool fits': {
      description: 'Switch between different kinds of problems. Write the decisive signal and a near-miss before you code.',
      recap: 'You can now compare candidate tools across different kinds of problems.',
    },
    'Find your way across a floor plan': {
      description:
        'Inspect nearby cells, separate rooms, then guide a robot along its shortest route. Choose from the movement contract before coding.',
      recap: 'You can now reason about map boundaries, connected areas, and minimum moves.',
    },
    'Solve a two-part puzzle': {
      description: 'Read a greenhouse log, solve the first request, then adapt to a changed rule using the same input.',
      recap: 'You can now separate input interpretation from a changing answer rule.',
    },
    'Choose under pressure': {
      description: 'Mix unfamiliar contracts with earlier tasks. Name the decisive signal and reject a near-miss before coding.',
      recap: 'You can now defend a choice across contrasting contracts.',
    },
  },
  frontend: {
    'Show one state': {
      description: 'Turn a single screen state into the words a person sees, before you model several states.',
      recap: 'You can now turn one screen state into the words a person sees.',
    },
    'Show empty or not': {
      description:
        'Choose the words for an empty list and for a list with items, including the one-item case, before you model several states.',
      recap: 'You can now choose the words for an empty list and a list with items.',
    },
    'Model valid states': {
      description: 'Use unions so a screen can only be in states that make sense.',
      recap: 'You can now model screen states with unions that rule out invalid combinations.',
    },
    'Decide what the screen shows': {
      description: 'Filter items and choose between loading, error, empty, and ready.',
      recap: 'You can now choose what to show for loading, error, empty, and ready states.',
    },
    'Build interface logic': {
      description: 'Sort a table, show form errors, choose page buttons, group items, and summarize filters.',
      recap: 'You can now derive table order, form errors, page buttons, groups, and filter labels.',
    },
    'Render with React': {
      description:
        'Keep state and release an effect subscription, keep list rows matched to their data with keys, and ignore stale results in an effect.',
      recap: 'You can now render components whose state, rows, and effects stay matched to the current data.',
    },
    'Build accessible interactions': {
      description: 'Wire a form, a disclosure, tabs, a live search, and an accordion that work with a keyboard and announce changes.',
      recap: 'You can now build forms, disclosures, tabs, search, and accordions with keyboard support.',
    },
    'Build composite widgets': {
      description: 'Reorder a list with buttons, keep focus inside a modal dialog, and pick suggestions from a combobox with the keyboard.',
      recap: 'You can now coordinate focus, state, and ARIA attributes across widgets made of several parts.',
    },
    'Build one connected browser feature': {
      description: 'Model, render, edit, save, recover, test, then build independently.',
      recap: 'You can now model, render, edit, save, recover, and test a connected browser feature.',
    },
    'Keep async updates current': {
      description:
        'Delay, limit, and ignore stale requests so the screen shows the right result, then autosave and report scrolling at a steady rate.',
      recap: 'You can now trace delayed and limited updates and keep stale results from replacing current ones.',
    },
    'Keep live connections correct': {
      description: 'Gate socket messages, compare polling with server events, and clean up subscriptions.',
      recap: 'You can now trace live-message rules, choose a transport, and clean up subscriptions.',
    },
    'Apply it to real code': {
      description: 'Debug a cart total, repair toolbar buttons that share one loop variable, and build a small interactive directory.',
      recap: 'You can now debug real interface code and build an interactive directory.',
    },
    'Interview round': {
      description: 'Clarify, plan, build, and explain a frontend interview task.',
      recap: 'You can now clarify, plan, build, and explain a frontend interview task.',
    },
  },
  sql: {
    'Read a table': {
      description: 'Choose columns, keep matching rows, sort them with tie-breakers, and take one page of the result.',
      recap: 'You can now choose columns, filter rows, give a result a complete order, and page through it.',
    },
    'Filter precisely': {
      description: 'Group AND and OR on purpose, match lists, ranges, and patterns, and decide what unknown values mean.',
      recap: 'You can now write filters that mean what you intend, including for NULL values.',
    },
    Summarize: {
      description: 'Count, add, and average rows per group, and filter before and after grouping.',
      recap: 'You can now summarize groups of rows and filter both rows and groups.',
    },
    'Combine tables': {
      description: 'Pair rows of two tables, keep rows with no match, and stop a join from multiplying sums.',
      recap: 'You can now join tables, find missing matches, and summarize lists without double counting.',
    },
    'Ask in steps': {
      description: 'Compare rows with a computed value, ask whether related rows exist, and name the steps of a longer question.',
      recap: 'You can now use subqueries, EXISTS, and WITH to answer a question in steps.',
    },
    'Design a schema': {
      description:
        'Write CREATE TABLE so the table itself refuses bad rows: keys, required and unique values, checks, defaults, links, and types.',
      recap: 'You can now design tables whose constraints guard every insert.',
    },
    'Change data safely': {
      description:
        'Scope UPDATE and DELETE, insert from queries and upsert, keep related changes in one transaction, and bind values from TypeScript.',
      recap: 'You can now change data with a deliberate scope, upsert, move rows, and keep multi-step changes atomic.',
    },
    'Rank and run totals': {
      description: 'Number and rank rows within groups, compare neighbours, keep running totals, and take the top rows of each group.',
      recap: 'You can now use window functions for ranks, running totals, neighbours, and top rows per group.',
    },
    'Make it fast': {
      description: 'Create indexes that match a query, and read the plan SQLite chooses: search or scan, sorted or not, covered or not.',
      recap: "You can now design indexes for a query and read SQLite's query plan, knowing it shows choices rather than speed.",
    },
    'Evolve a schema': {
      description: 'Add, rename, and remove columns, backfill existing rows, and rebuild a table when SQLite cannot change it in place.',
      recap: 'You can now migrate a schema step by step without losing rows.',
    },
    'Bring it together': {
      description:
        'Build a multi-table report with steps and windows, then answer an interview question from clarification to explanation.',
      recap: 'You can now combine joins, grouping, windows, and steps in one report, and work through a SQL interview question.',
    },
  },
  backend: {
    'What a request is': {
      description:
        'Split a target into path and query, decode a query, read the request line and headers, and accept a JSON body only when the request declares it.',
      recap: 'You can now read the parts of a request: method, path, query, headers, and body.',
    },
    'Check one value': {
      description: 'Accept a value only when it is the right type and in range, using the conditions from Foundations.',
      recap: 'You can now check one value against a rule and reject the rest.',
    },
    'Route a request': {
      description:
        'Match path patterns and read their parameters, choose between 404 and 405, clean and build paths safely, and pick the most specific route.',
      recap: 'You can now route a request to its handler and answer precisely when no route fits.',
    },
    'Handle untrusted input': {
      description: 'Validate values at runtime, from a guided rep to a fresh recall task.',
      recap: 'You can now validate untrusted values before using them.',
    },
    'Validate a whole batch': {
      description: 'Normalize IDs, report conflicting errors, and accept all or nothing.',
      recap: 'You can now normalize a batch, report conflicting errors, and accept all or nothing.',
    },
    'Return predictable results': {
      description: 'Page a list without changing the original data, and handle a ticket request.',
      recap: 'You can now page data without changing it and handle a ticket request.',
    },
    'Shape requests and responses': {
      description: 'Turn query parameters into safe filters and errors into safe responses.',
      recap: 'You can now turn query parameters into safe filters and shape predictable responses.',
    },
    'Query and change local data': {
      description:
        'Run real SQLite from TypeScript: undo a failed stock transfer, total orders per customer with a join, and restock inventory all or nothing. These reps live in the SQL track.',
      recap: 'You can now write joins and aggregates and keep multi-statement changes atomic.',
    },
    'Handle concurrent writes': {
      description:
        'See how two saves based on the same read lose a change, then refuse stale writes with version numbers, If-Match tags, and compare-and-set.',
      recap: "You can now detect and refuse a stale write instead of losing someone else's change.",
    },
    'Stay reliable': {
      description:
        'Check cache freshness, back off retries, limit request rates, avoid double effects, resubmit payments safely, roll back optimistic updates, and share resources safely.',
      recap: 'You can now trace caches, retries, rate limits, duplicate requests, and shared-resource ownership.',
    },
    'Run background jobs': {
      description:
        'Retry failed jobs with growing waits and dead letters, claim jobs with leases, skip repeated messages, publish events from an outbox, and replay a queue under a retry policy.',
      recap: 'You can now run work outside the request, retry it safely, and handle jobs and messages that arrive more than once.',
    },
    'Limit request rates': {
      description:
        'Refill a token bucket, count a sliding window, estimate one from two counters, answer 429 with Retry-After, and keep a bucket per caller.',
      recap: 'You can now limit how often each caller may ask and tell refused callers when to come back.',
    },
    'Evolve an API': {
      description:
        'Choose a response version, tell compatible changes from breaking ones, announce a deprecation and a sunset, apply webhook deliveries once and in order, and answer clients pinned to older versions.',
      recap: 'You can now change an API while the clients built against it keep working.',
    },
    'Read and improve code': {
      description: 'Trace an existing importer, then refactor a working report without changing its behavior.',
      recap: 'You can now trace an importer and refactor a report while preserving its behavior.',
    },
    'Review suggested code': {
      description:
        'Check suggested functions against their contracts: a skipped empty case, an invented method, and medians that only look right.',
      recap: 'You can now verify suggested code against its contract before trusting it.',
    },
    'Debug in fresh contexts': {
      description: 'Repair a date filter that drops its boundaries, a total that loses a cent, and a reducer that breaks undo.',
      recap: 'You can now reproduce a reported bug, find its cause, and repair it without breaking the rest of the contract.',
    },
    'Find bugs with your own cases': {
      description:
        'Write cases that expose faulty pagination, repair a range label, then expose faulty overlap checks from requirements alone.',
      recap: 'You can now write cases that expose faulty versions of a function, and repair one.',
    },
    'Maintain unfamiliar code': {
      description:
        'Read a shipping module, reproduce its reported bug, guard and fix it, adapt it to a changed rule, then maintain two modules in other domains.',
      recap: 'You can now read unfamiliar code, reproduce a bug, guard and fix it, and adapt it to a changed requirement.',
    },
    'Interview round': {
      description: 'Clarify, validate, and explain a backend interview task.',
      recap: 'You can now clarify, validate, and explain a backend interview task.',
    },
  },
  devops: {
    'Read CI output': {
      description:
        'Read an exit code, find the first real error in a noisy log, decide which steps ran after a failure, turn compiler errors into annotations, and name the step that failed a job.',
      recap: 'You can now read CI output: what an exit code means and which line explains a failure.',
    },
    'Check configuration': {
      description:
        'Read a port with a default, check every setting against a schema at startup, mask secrets in log lines, read a .env file, and compare two environments without printing secrets.',
      recap: "You can now check a service's settings before it starts and keep its secrets out of logs.",
    },
  },
}
