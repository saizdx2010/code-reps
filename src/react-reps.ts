import { see } from './rep-helpers.ts'
import type { Rep } from './rep-types.ts'
const check = (name: string, steps: unknown[], expected: unknown[], channel = 'north') => ({
  name,
  input: [{ props: { channel }, steps }],
  expected,
})
const react = (name: string, props: unknown, steps: unknown[], expected: unknown[]) => ({ name, input: [{ props, steps }], expected })
const task = (id: string, title: string) => ({ id, title })
const tasks = [task('a', 'Write'), task('b', 'Test'), task('c', 'Ship')]
const reversed = [...tasks].reverse()
const respond = (query: string, value: string[]) => ({ do: 'respond', query, value })
export const reactReps: Rep[] = [
  {
    id: 'react-channel-counter',
    title: 'Subscribe with a React effect',
    category: 'Frontend',
    format: 'frontend',
    reactPreview: true,
    functionName: 'ChannelCounter',
    prompt:
      'Write ChannelCounter({ channel, source }) as a React component using state and an effect. React is supplied as a global; do not import packages. Return TSX. source.subscribe(channel, listener) registers a listener and returns an unsubscribe function. Each emitted integer is added to the total, initially zero. Render a paragraph data-testid="total" with exactly channel + ": " + total, and a native button data-testid="reset" labelled Reset that resets the total to zero. Subscribe only to the current channel. When channel changes, retain the total, unsubscribe from the old channel, and subscribe to the new one. On unmount remove every subscription. Keep exactly one active subscription while mounted, including after reset and repeated updates. Channels are nonempty ASCII words; emitted integers are between -10 and 10, with at most 20 events per check. Do not change props or source. Use React.useState and React.useEffect; these implementation choices remain self-reviewed. The source is deterministic, not a real timer or network connection.',
    brief: {
      summary: 'Build a React counter subscribed to one event channel.',
      rules: [
        'Write ChannelCounter({ channel, source }) returning TSX; React is a supplied global, with no package imports.',
        'Use state and an effect. source.subscribe(channel, listener) returns unsubscribe. Add each emitted integer to total, initially zero.',
        'Render total as channel + ": " + total in data-testid="total", and a native Reset button data-testid="reset" that sets total to zero.',
        'Keep exactly one subscription while mounted. On channel change retain total, release the old subscription, and subscribe to the new channel. On unmount release all subscriptions.',
        'Do not change props or source. Channels are nonempty ASCII words; each check has at most 20 events, with integers from -10 to 10.',
      ],
      edgeCases: [
        'Ignore events from other channels; support negative and zero increments and repeated events.',
        'Reset must not duplicate subscriptions; repeated channel changes must release old listeners.',
      ],
    },
    example: {
      input: 'north emits 2, then -1; switch to south; south emits 3',
      output: 'south: 4; one active subscription, then zero after unmount',
    },
    note: 'Checks establish rendered behavior and subscription counts in the sandbox. They do not prove effect usage, visual quality, accessibility, or real timer/network behavior.',
    vocabulary: [
      { term: 'Effect cleanup', meaning: 'A function React calls before replacing an effect or removing its component.' },
      { term: 'Subscription', meaning: 'A registration that receives events until it is removed.' },
    ],
    planPrompt: 'What state must survive a channel change? Which resource belongs to one effect lifetime, and how will you release it?',
    starter: `type CounterProps = { channel: string; source: { subscribe: (channel: string, listener: (value: number) => void) => () => void } }
function ChannelCounter({ channel, source }: CounterProps) {
  // React.useState and React.useEffect are available here.
  return <p data-testid="total">{channel}: 0</p>
}`,
    hints: [
      'Separate the displayed total from the subscription lifetime.',
      'An event handler needs the latest total even when several events arrive. Think about the updater form of the state setter.',
      'Use an effect depending on channel and source. Return the unsubscribe function from that effect; add each event with setTotal(previous => previous + value).',
    ],
    domPreview: {
      title: 'Your React channel counter',
      description: 'Inspect the initial counter and try Reset. Event emissions, channel changes, and unmount are exercised by Run checks.',
      props: { channel: 'north' },
      review: [
        'Inspect your state and effect dependencies, and trace the returned cleanup.',
        'Tab to Reset and activate it with Enter and Space.',
        'Check readability at phone width; subscription checks do not prove accessible announcements.',
      ],
    },
    checks: [
      check(
        'Initial render and subscription',
        [],
        [
          see('total', 'text', 'north: 0'),
          see('reset', 'text', 'Reset'),
          see('reset', 'tag', 'button'),
          see('harness', 'subscriptions', 1),
        ],
      ),
      check(
        'Repeated events use current state',
        [
          { do: 'emit', channel: 'north', value: 2 },
          { do: 'emit', channel: 'north', value: -1 },
          { do: 'emit', channel: 'other', value: 9 },
        ],
        [see('total', 'text', 'north: 1'), see('harness', 'subscriptions', 1)],
      ),
      check(
        'Reset keeps the subscription',
        [
          { do: 'emit', channel: 'north', value: 5 },
          { do: 'click', target: 'reset' },
          { do: 'emit', channel: 'north', value: -2 },
        ],
        [see('total', 'text', 'north: -2'), see('harness', 'subscriptions', 1)],
      ),
      check(
        'Dependency change cleans up the old channel',
        [
          { do: 'emit', channel: 'north', value: 2 },
          { do: 'props', props: { channel: 'south' } },
          { do: 'emit', channel: 'north', value: 8 },
          { do: 'emit', channel: 'south', value: 3 },
        ],
        [see('total', 'text', 'south: 5'), see('harness', 'subscriptions', 1)],
      ),
      check(
        'Repeated dependency changes retain one subscription',
        [
          { do: 'props', props: { channel: 'south' } },
          { do: 'props', props: { channel: 'north' } },
          { do: 'emit', channel: 'north', value: 0 },
        ],
        [see('total', 'text', 'north: 0'), see('harness', 'subscriptions', 1)],
      ),
      check(
        'Unmount releases the subscription',
        [{ do: 'props', props: { channel: 'south' } }, { do: 'unmount' }, { do: 'emit', channel: 'south', value: 5 }],
        [see('total', 'exists', false), see('harness', 'subscriptions', 0)],
      ),
    ],
  },

  {
    id: 'react-row-keys',
    title: 'Keep each row’s identity with keys',
    category: 'Frontend',
    format: 'frontend',
    reactPreview: true,
    functionName: 'TaskRows',
    context:
      'A to-do list lets people tick tasks before saving. When the list is re-sorted, a ticked box must stay with its task, not with whatever task now sits in the same position.',
    prompt:
      'Write TaskRows({ tasks }) as a React component. React is supplied as a global; do not import packages. Return TSX. Render a list (data-testid="list") with one item per task, in order, with data-testid="row-ID" where ID is the task’s id. Each item contains a label holding a checkbox (data-testid="check-ID") followed by the task’s title, so the title names the checkbox. The checkbox is not controlled by props: it keeps whatever the user ticked. When tasks are reordered, added, or removed, each task keeps its own row element and its own tick. Task ids are unique; titles may repeat. Do not change props.',
    brief: {
      summary: 'Write TaskRows({ tasks }): a React list whose rows keep their identity when tasks move.',
      rules: [
        'React is a supplied global; return TSX without importing packages.',
        'Render data-testid="list" with one item per task, in order, each with data-testid="row-ID".',
        'Each item has a label holding a checkbox (data-testid="check-ID") and then the title, so the title names the checkbox.',
        'The checkbox is not controlled by props. When tasks are reordered, added, or removed, each task keeps its own row element and its own tick.',
      ],
      edgeCases: ['Task ids are unique, but titles may repeat.', 'Render titles as text and do not change props.'],
    },
    example: {
      input: 'tick Write, then reverse the tasks',
      output: 'Write is still ticked, now in the last row',
    },
    note: 'Checks render with React in the sandbox, tick boxes by clicking them, and change props. They confirm that the same elements and ticks follow each task; they do not establish visual quality or screen-reader output.',
    vocabulary: [
      { term: 'Key', meaning: 'a value React uses to match an element in one render with the same element in the next' },
      { term: 'Uncontrolled input', meaning: 'an input that keeps its own value in the page instead of in React state' },
    ],
    planPrompt:
      'What should React use to recognize the same task after the list is reversed? Predict what goes wrong with the position as the key.',
    starter: `type Task = { id: string; title: string }
function TaskRows({ tasks }: { tasks: Task[] }) {
  // Render one row per task. Each row needs a key.
  return <ul data-testid="list"></ul>
}`,
    hints: [
      'React matches list items between renders by their keys, not by their content.',
      'The position in the array changes when tasks move, and titles can repeat, so neither identifies a task.',
      'Use the task’s id as the key on each row element.',
    ],
    domPreview: {
      title: 'Your task rows',
      description: 'Tick a task. Reordering and removal are exercised by Run checks.',
      props: { tasks },
      review: [
        'Click each title and confirm it toggles its own checkbox.',
        'Reach every checkbox with Tab and toggle it with Space.',
        'Inspect your key choice; checks show behavior, not the reason it works.',
      ],
    },
    checks: [
      react(
        'Renders one labelled checkbox per task',
        { tasks },
        [],
        [
          see('list', 'prop:childElementCount', 3),
          see('row-a', 'tag', 'li'),
          see('check-a', 'attr:type', 'checkbox'),
          see('check-a', 'label', 'Write'),
          see('check-c', 'label', 'Ship'),
        ],
      ),
      react(
        'Reordering keeps each row element',
        { tasks },
        [
          { do: 'mark', target: 'row-a' },
          { do: 'props', props: { tasks: reversed } },
        ],
        [see('row-a', 'prop:__marked', true), see('row-c', 'prop:__marked', undefined)],
      ),
      react(
        'A tick stays with its task after reordering',
        { tasks },
        [
          { do: 'click', target: 'check-a' },
          { do: 'props', props: { tasks: reversed } },
        ],
        [see('check-a', 'prop:checked', true), see('check-c', 'prop:checked', false)],
      ),
      react(
        'Adding a task at the top keeps existing ticks',
        { tasks },
        [
          { do: 'click', target: 'check-a' },
          { do: 'props', props: { tasks: [task('n', 'Plan'), ...tasks] } },
        ],
        [see('check-n', 'prop:checked', false), see('check-a', 'prop:checked', true), see('list', 'prop:childElementCount', 4)],
      ),
      react(
        'Removing a task keeps the others’ ticks',
        { tasks },
        [
          { do: 'click', target: 'check-b' },
          { do: 'props', props: { tasks: tasks.slice(1) } },
        ],
        [see('check-b', 'prop:checked', true), see('row-a', 'exists', false), see('list', 'prop:childElementCount', 2)],
      ),
      react(
        'Tasks with the same title stay distinct',
        { tasks: [task('x', 'Same'), task('y', 'Same')] },
        [
          { do: 'click', target: 'check-y' },
          { do: 'props', props: { tasks: [task('y', 'Same'), task('x', 'Same')] } },
        ],
        [see('check-y', 'prop:checked', true), see('check-x', 'prop:checked', false)],
      ),
      react('Titles containing markup stay text', { tasks: [task('m', '<b>Bold</b>')] }, [], [see('check-m', 'label', '<b>Bold</b>')]),
    ],
  },
  {
    id: 'react-stale-request',
    title: 'Ignore a stale result in an effect',
    category: 'Frontend',
    format: 'frontend',
    reactPreview: true,
    functionName: 'SearchResults',
    context:
      'A search page asks the server for results every time the query changes. Responses can arrive out of order, so a slow answer for an old query must never replace the results for the current one.',
    prompt:
      'Write SearchResults({ query, source }) as a React component using state and an effect. React is supplied as a global; do not import packages. Return TSX. Whenever query changes, call source.request(query, done) exactly once; done(results) is called later with a list of strings, and requests cannot be cancelled. Render a status paragraph (data-testid="status") and, once results arrive, one list item per result (data-testid="result"). While the current query has no answer, the status is "Searching for QUERY" and no results show. When its answer arrives, the status is "N results for QUERY", "1 result for QUERY", or "No results for QUERY". Ignore every answer to an earlier query, even when it arrives last. Do not change props.',
    brief: {
      summary: 'Write SearchResults({ query, source }): request results when query changes and show only answers for the current query.',
      rules: [
        'React is a supplied global; use state and an effect, and return TSX without imports.',
        'Whenever query changes, call source.request(query, done) exactly once. done(results) arrives later with a list of strings; requests cannot be cancelled.',
        'Render a status paragraph (data-testid="status") and one item per result (data-testid="result").',
        'While the current query has no answer, the status is "Searching for QUERY" and no results show. Then it is "N results for QUERY", "1 result for QUERY", or "No results for QUERY".',
      ],
      edgeCases: ['Ignore every answer to an earlier query, even when it arrives last.', 'Do not change props.'],
    },
    example: {
      input: "query 'ap' changes to 'apr'; the answer for apr arrives, then a late answer for ap",
      output: 'the page shows the apr results and "1 result for apr"',
    },
    note: 'source is a deterministic test double: checks decide when each answer arrives. Checks confirm what renders and how many requests were made; they do not establish real network behavior, effect usage, or screen-reader output.',
    vocabulary: [
      { term: 'Race condition', meaning: 'a bug that depends on which of several operations finishes first' },
      { term: 'Stale result', meaning: 'a result for a request that is no longer the current one' },
    ],
    planPrompt:
      'Write the order of events when an old answer arrives after the new one. What does each effect run need to know when its answer arrives?',
    starter: `type Source = { request: (query: string, done: (results: string[]) => void) => void }
function SearchResults({ query, source }: { query: string; source: Source }) {
  // React.useState and React.useEffect are available here.
  return <p data-testid="status">Searching for {query}</p>
}`,
    hints: [
      'Each effect run belongs to one query. When it is replaced, its answer no longer matters.',
      'An effect’s cleanup runs before the next run for a new query. Use it to mark the old run as finished.',
      'Keep a local flag in the effect that the cleanup sets, and only store results while the flag says the run is still current. Store which query the results belong to, so the old list disappears while searching.',
    ],
    domPreview: {
      title: 'Your search results',
      description: 'The preview shows the waiting state. Answers, query changes, and late responses are exercised by Run checks.',
      props: { query: 'ap' },
      review: [
        'Trace your effect’s cleanup for a query change and confirm a late answer is ignored.',
        'Check that the status reads naturally for zero, one, and several results.',
        'Consider announcing the status politely; checks do not establish screen-reader output.',
      ],
    },
    checks: [
      react(
        'Starts one request and shows the waiting status',
        { query: 'ap' },
        [],
        [see('harness', 'requests', 1), see('status', 'text', 'Searching for ap'), see('result', 'count', 0)],
      ),
      react(
        'Shows results when the answer arrives',
        { query: 'ap' },
        [respond('ap', ['Apple', 'Apricot'])],
        [see('result', 'texts', ['Apple', 'Apricot']), see('status', 'text', '2 results for ap')],
      ),
      react('One result', { query: 'ap' }, [respond('ap', ['Apple'])], [see('status', 'text', '1 result for ap')]),
      react('No results', { query: 'zz' }, [respond('zz', [])], [see('status', 'text', 'No results for zz'), see('result', 'count', 0)]),
      react(
        'A new query makes one new request and clears old results',
        { query: 'ap' },
        [respond('ap', ['Apple']), { do: 'props', props: { query: 'apr' } }],
        [see('harness', 'requests', 2), see('status', 'text', 'Searching for apr'), see('result', 'count', 0)],
      ),
      react(
        'A late answer for an old query is ignored',
        { query: 'ap' },
        [{ do: 'props', props: { query: 'apr' } }, respond('apr', ['Apricot']), respond('ap', ['Apple', 'Apricot'])],
        [see('result', 'texts', ['Apricot']), see('status', 'text', '1 result for apr')],
      ),
      react(
        'An early answer for an old query is ignored',
        { query: 'ap' },
        [{ do: 'props', props: { query: 'apr' } }, respond('ap', ['Apple', 'Apricot'])],
        [see('status', 'text', 'Searching for apr'), see('result', 'count', 0)],
      ),
      react(
        'Re-rendering with the same query does not request again',
        { query: 'ap' },
        [{ do: 'props', props: { query: 'ap' } }],
        [see('harness', 'requests', 1)],
      ),
      react(
        'Results render as text',
        { query: 'b' },
        [respond('b', ['<b>bold</b>'])],
        [see('result', 'texts', ['<b>bold</b>']), see('result', 'prop:childElementCount', 0)],
      ),
    ],
  },
]
