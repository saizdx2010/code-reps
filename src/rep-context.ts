import { catalogTopic } from './catalog-labels.ts'
import { repIndex as reps, skillIndex } from './catalog-index.ts'
import { migratePathId, paths } from './path.ts'
import { repLevel } from './rep-levels.ts'
import type { RepOrigin } from './rep-origin.ts'

// Loaded with the workspace stepper, not at startup: it needs the Library's topic labels and the track lists.
/** The list the workspace steps through: the lesson's reps, the track's reps in trail order, or the rep's Library topic. */
export type RepContext = { label: string; repIds: string[] }

export function repContext(origin: RepOrigin, repId: string, goalPathId: string): RepContext {
  if (origin.kind === 'lesson') {
    const skill = skillIndex.find(item => item.id === origin.skillId)
    if (skill?.repIds.includes(repId)) return { label: skill.title, repIds: [...skill.repIds] }
  }
  if (origin.kind === 'view' && (origin.view === 'home' || origin.view === 'paths')) {
    const goal = migratePathId(goalPathId)
    const pathReps = (id: string) => [...new Set(paths.find(path => path.id === id)?.stages.flatMap(stage => [...stage.repIds]) ?? [])]
    // The goal track first; a rep outside it steps through the first track that holds it.
    const path = [paths.find(item => item.id === goal), ...paths].find(item => item && pathReps(item.id).includes(repId))
    if (path) return { label: path.title, repIds: pathReps(path.id).filter(id => reps.some(rep => rep.id === id)) }
  }
  const rep = reps.find(item => item.id === repId)
  if (!rep) return { label: '', repIds: [] }
  const topic = catalogTopic(rep)
  // The same order as the Library's topic pane: easiest first, equal levels in catalog order.
  const repIds = reps
    .filter(item => catalogTopic(item) === topic)
    .sort((a, b) => (repLevel(a.id) ?? 4) - (repLevel(b.id) ?? 4))
    .map(item => item.id)
  return { label: topic, repIds }
}
