import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'
export const reactDepth: Record<string, RepDepth> = {
  'react-channel-counter': {
    reasoning:
      'The total belongs to component state. The subscription belongs to the effect for channel and source. Returning its disposer makes replacement and unmount release that exact registration. Functional updates add to the latest total.',
    trace:
      'north emits 2: total becomes 2. Switching to south removes north and registers south while retaining 2. A north event does nothing; south emits 3 and total becomes 5. Unmount removes south, leaving zero subscriptions.',
    alternative:
      'A class component can pair lifecycle methods with a stored disposer, but duplicates replacement and unmount logic. A ref can hold the total but does not itself request a rendered update.',
    counterexample:
      'An empty dependency list keeps listening to north after switching to south. Omitting the returned disposer leaves two subscriptions on replacement and one or more after unmount. Capturing total in the listener can lose repeated increments.',
    transfer:
      'Add a pause control that releases the subscription without resetting the total. Decide which dependency changes the effect lifetime. This variation is self-reviewed; the original checks do not validate it.',
  },
  'react-row-keys': {
    reasoning:
      'React matches the children of a list between renders by key. With the task id as the key, a reordered list moves the existing li elements, and each element keeps its own DOM state, including the uncontrolled checkbox’s tick. With the position as the key, React keeps the elements where they are and only updates their text and attributes, so the tick stays in the slot rather than following the task.',
    trace:
      'Tick Write, then reverse the tasks. Keyed by id, React sees keys c, b, a and moves the Write row to the end with its tick. Keyed by position, React sees keys 0, 1, 2 again, rewrites row 0’s title to Ship, and Ship now appears ticked.',
    alternative:
      'Storing the ticks in React state keyed by task id would make the tick follow the task even with bad keys, but the row elements would still be reused for the wrong tasks, which breaks focus and animations. Generating a random key on each render is worse than either: every row is recreated on every render.',
    counterexample:
      'Using the index as the key passes the first render and fails as soon as the order changes. Using the title as the key fails when two tasks share a title, because the keys collide. Both mistakes look fine in a static screenshot.',
    transfer:
      'Let each row have a text field for notes that is also uncontrolled. Decide whether anything besides the key needs to change for the notes to follow their tasks. This changed contract is self-reviewed; the original checks do not validate it.',
  },
  'react-stale-request': {
    reasoning:
      'Each effect run belongs to one query. Its cleanup runs before the next run starts, so a flag that the cleanup sets marks the run as finished, and an answer that arrives later is dropped. Storing which query an answer belongs to lets the component show the waiting state for a new query immediately, without clearing state inside the effect.',
    trace:
      'Query ap requests and waits. The query changes to apr: cleanup marks the ap run finished, and a new run requests apr. The apr answer arrives and is stored with its query. Then the late ap answer arrives, but its run’s flag is off, so it is ignored and the page still shows the apr result.',
    alternative:
      'An AbortController cancels a real fetch so the network work stops too; this source cannot be cancelled, so a flag is the only option here. A request counter in a ref, comparing the counter captured when the request started with the latest one, also works. Data libraries such as TanStack Query handle this ordering for you.',
    counterexample:
      'Storing every answer without a flag shows the ap results after the late answer arrives. An empty dependency array requests only once and never searches for apr. Calling setState to clear results inside the effect works but renders twice per query change.',
    transfer:
      'Debounce the search so typing quickly sends one request after a pause. Decide where the timer lives and how its cleanup interacts with the stale-answer flag. This changed contract is self-reviewed; the original checks do not validate it.',
  },
}
export const reactGuides: Record<string, ReflectionGuide> = {
  'react-channel-counter': {
    plan: [
      'Separate persistent state from the registration lifetime.',
      'Name the changes that require a new subscription.',
      'Plan how to observe cleanup at replacement and unmount.',
    ],
    explanation: [
      'Trace an old-channel event after a switch.',
      'Explain why the state updater uses its previous value.',
      'Inspect effect use and dependencies yourself; passing checks only establishes behavior.',
    ],
    example:
      'I retain total in state and subscribe in an effect depending on channel and source. The listener adds through a functional updater. The effect returns the unsubscribe function, so replacing it releases the old listener and unmount releases the last one. Reset changes state without changing the subscription.',
  },
  'react-row-keys': {
    plan: [
      'Name what React should use to recognize the same task after the list is reversed.',
      'Predict what goes wrong with the position as the key.',
    ],
    explanation: [
      'Explain how keys decide which element each task gets in the next render.',
      'Explain why neither the position nor the title works as a key here.',
      'Inspect your key choice yourself; passing checks only establishes behavior.',
    ],
    example:
      'I render one li per task with key set to the task id, and the checkbox is uncontrolled. When the tasks are reversed, React moves each li with its checkbox instead of rewriting rows in place, so every tick stays with its task.',
  },
  'react-stale-request': {
    plan: [
      'Write the order of events when an old answer arrives after the new one.',
      'Name what each effect run needs to know when its answer arrives.',
    ],
    explanation: [
      'Trace a late answer for an old query through your effect and cleanup.',
      'Explain how the waiting status appears for a new query.',
      'Inspect your dependencies yourself; passing checks only establishes behavior.',
    ],
    example:
      'My effect depends on query and source. It requests once and stores the answer with its query only while a local flag is on; the cleanup turns the flag off. I show results only when the stored answer belongs to the current query, so a new query shows the waiting status at once.',
  },
}
