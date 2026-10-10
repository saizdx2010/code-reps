import { paths } from './path.ts'
import type { RepSummary } from './catalog-index'

export const formatLabels: Record<string, string> = {
  algorithm: 'Exercise', debug: 'Debugging', read: 'Reading code', transform: 'Working with data',
  frontend: 'Frontend', backend: 'Backend', refactor: 'Improving code',
}

const topicLabels: Record<string, string> = {
  'Arrays & strings': 'Arrays', 'Arrays & sets': 'Maps and sets', 'Strings & maps': 'Maps and sets',
  'Stacks & strings': 'Stacks and queues', Stacks: 'Stacks and queues', 'Stacks & queues': 'Stacks and queues',
  Strings: 'Text', 'Collection basics': 'Collections',
  'AI-era coding': 'Checking suggested code', 'TypeScript modeling': 'Modeling states',
  'Frontend core': 'Interface logic', 'Frontend state': 'Interface logic',
  'Frontend implementation': 'Frontend projects', 'Frontend accessibility': 'Accessible interactions',
  'Backend core': 'Requests and validation', 'Backend validation': 'Requests and validation',
  'Backend implementation': 'Backend projects', 'Real-world debugging': 'Debugging',
  'Connected browser feature': 'Building a browser feature', 'Data transformation': 'Working with data',
  'Code reading': 'Reading code', Refactoring: 'Improving code',
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
  return topicLabels[rep.category] ?? rep.category
}
