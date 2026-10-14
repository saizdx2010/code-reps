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
}
