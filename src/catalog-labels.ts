import { paths } from './path.ts'
import type { RepSummary } from './catalog-index'

export const formatLabels: Record<string, string> = {
  algorithm: 'Exercise',
  debug: 'Debugging',
  read: 'Reading code',
  transform: 'Working with data',
  frontend: 'Frontend',
  backend: 'Backend',
  refactor: 'Improving code',
}

const topicLabels: Record<string, string> = {
  'Arrays & strings': 'Arrays',
  'Arrays & sets': 'Maps and sets',
  'Strings & maps': 'Maps and sets',
  'Stacks & strings': 'Stacks and queues',
  Stacks: 'Stacks and queues',
  'Stacks & queues': 'Stacks and queues',
  Strings: 'Text',
  'Collection basics': 'Collections',
  'TypeScript modeling': 'Modeling states',
  'Frontend core': 'Interface logic',
  'Frontend state': 'Interface logic',
  'Frontend implementation': 'Frontend projects',
  'Frontend accessibility': 'Accessible interactions',
  'Backend core': 'Requests and validation',
  'Backend validation': 'Requests and validation',
  'Backend implementation': 'Backend projects',
  'Real-world debugging': 'Debugging',
  'Connected browser feature': 'Building a browser feature',
  'Data transformation': 'Reading and improving code',
  'Code reading': 'Reading and improving code',
  Refactoring: 'Reading and improving code',
  'AI-era coding': 'Reading and improving code',
  Backend: 'Backend projects',
  'Backend interview': 'Backend projects',
  'Frontend interview': 'Frontend projects',
  Frontend: 'Interface logic',
}
// Practical concepts split by what they practice, so one 25-rep catch-all becomes three topics with lesson homes.
const practicalTopics: Record<string, string> = {
  'singleton-owner': 'Shared resources and events',
  'pubsub-trace': 'Shared resources and events',
  'injected-clock': 'Shared resources and events',
  'websocket-gate': 'Shared resources and events',
  'choose-live-transport': 'Shared resources and events',
  'shared-resource': 'Shared resources and events',
  'subscription-cleanup': 'Shared resources and events',
  'room-leases': 'Shared resources and events',
  'cache-freshness': 'Caching and retries',
  'retry-backoff': 'Caching and retries',
  'idempotent-ledger': 'Caching and retries',
  'optimistic-balance': 'Caching and retries',
}
const problemStages = paths.find(path => path.id === 'algorithms-data-structures')!.stages
const lookupReps = new Set(['most-frequent-number', 'first-unique-character', 'first-duplicate-label', 'count-statuses'])

/** One primary topic per rep; authored categories and learner records stay unchanged. */
export function catalogTopic(rep: Pick<RepSummary, 'id' | 'category'>): string {
  if (rep.id === 'simplify-file-path') return 'Stacks and queues'
  if (rep.category.startsWith('Algorithm ') || rep.category === 'Problem-solving patterns') {
    return problemStages.find(stage => (stage.repIds as readonly string[]).includes(rep.id))?.title ?? 'Problem solving'
  }
  if (rep.category === 'Arrays & maps') return lookupReps.has(rep.id) ? 'Maps and sets' : 'Arrays'
  if (rep.category === 'Practical concepts') return practicalTopics[rep.id] ?? 'Async and timing'
  return topicLabels[rep.category] ?? rep.category
}

/**
 * The Library's two levels: the seven lesson areas in learning order, each holding its practice topics in learning
 * order. Lessons use the same area names, so a topic found in one tab can be found in the other.
 */
export const catalogAreas: { title: string; topics: string[] }[] = [
  {
    title: 'Language & problem solving',
    topics: [
      'TypeScript basics',
      'Collections',
      'Arrays',
      'Text',
      'Maps and sets',
      'Stacks and queues',
      'Modeling states',
      'TypeScript boundaries',
    ],
  },
  {
    title: 'Algorithms & data structures',
    topics: [
      'Sort and merge',
      'Search sorted data and scan windows',
      'Ranges and linked structures',
      'Recursion',
      'Trees and graphs',
      'Grids',
      'Backtracking and dynamic programming',
      'Harder patterns',
      'Solve a two-part puzzle',
      'Problem solving',
    ],
  },
  { title: 'Frontend', topics: ['Interface logic', 'Accessible interactions', 'Building a browser feature', 'Frontend projects'] },
  { title: 'Backend & data', topics: ['Requests and validation', 'Backend projects'] },
  { title: 'Async & runtime', topics: ['Async and timing'] },
  { title: 'Patterns & resources', topics: ['Shared resources and events'] },
  {
    title: 'Reliability & testing',
    topics: ['Debugging', 'Testing with cases', 'Caching and retries', 'Reading and improving code', 'Maintaining code'],
  },
]

/** The area a topic belongs to; a topic missing from the map falls back to the last area rather than disappearing. */
export const catalogArea = (topic: string) =>
  catalogAreas.find(area => area.topics.includes(topic))?.title ?? catalogAreas[catalogAreas.length - 1].title
