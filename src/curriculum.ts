import { paths } from './path.ts'
import { journeys, stageLabels } from './learning.ts'
import type { JourneyProgress } from './learning.ts'

export const pathApplications: Partial<Record<(typeof paths)[number]['id'], { repId: string; reason: string }[]>> = {
  frontend: [{ repId: 'project-team-directory', reason: 'Combine visible data, request states, and browser interaction in a team directory.' }],
  backend: [{ repId: 'project-ticket-api', reason: 'Combine validation, filtering, and paging in a ticket API.' }],
  'real-world': [
    { repId: 'project-team-directory', reason: 'Extend the focused directory feature into a multi-file implementation.' },
    { repId: 'project-ticket-api', reason: 'Extend the request handler into a multi-file API implementation.' },
  ],
}

export function repCurriculumRole(repId: string) {
  const journey = journeys.find(item => [item.guided, item.independent, item.recall].includes(repId))
  if (!journey) return 'Application'
  return journey.guided === repId ? 'Guided' : journey.independent === repId ? 'Independent' : 'Recall'
}

export function repCurriculumEvidence(repId: string, progress: JourneyProgress[]) {
  const state = progress.find(item => [item.journey.guided, item.journey.independent, item.journey.recall].includes(repId))
  if (!state) return ''
  if (state.journey.recall !== repId) return `${state.journey.title}: ${stageLabels[state.stage]}.`
  if (state.retained) return `${stageLabels[state.stage]}: fresh recall completed without hints after the gap.`
  if (state.recallAt) return `${state.recallDue ? 'Recall ready' : 'Recall available'} ${new Date(state.recallAt).toLocaleDateString()}.`
  return 'Complete independent practice without hints to schedule recall.'
}

type PathId = (typeof paths)[number]['id']

/** Foundations is the shared root; every other track builds on it. Paths keep their own rep lists for badges and goals. */
export const foundationsPathId: PathId = 'typescript'
export const trackGroups: { title: string; pathIds: PathId[] }[] = [
  { title: 'Problem solving', pathIds: ['algorithms-data-structures', 'interviews'] },
  { title: 'Build for the browser and server', pathIds: ['typescript-browser', 'frontend', 'backend'] },
  { title: 'Work in real code', pathIds: ['practical-concepts', 'real-world', 'ai-era'] },
]

const foundationsRepIds = new Set<string>(paths.find(path => path.id === foundationsPathId)!.stages.flatMap(stage => stage.repIds))

/** A stage made only of Foundations reps is shown once, as a link back to Foundations, instead of repeating it. */
export function stageCoveredByFoundations(pathId: string, repIds: readonly string[]) {
  return pathId !== foundationsPathId && repIds.length > 0 && repIds.every(id => foundationsRepIds.has(id))
}
