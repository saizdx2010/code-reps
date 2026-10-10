import { reps } from './rep.ts'
import { paths } from './path.ts'
import { journeys, stageLabels } from './learning.ts'
import type { JourneyProgress } from './learning.ts'

export const pathApplications: Partial<Record<(typeof paths)[number]['id'], { repId: string; reason: string }[]>> = {
  frontend: [{ repId: 'project-team-directory', reason: 'Combine visible data, request states, and browser interaction in a team directory.' }],
  backend: [{ repId: 'project-ticket-api', reason: 'Combine validation, filtering, and paging in a ticket API.' }],
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
  { title: 'Choose a track', pathIds: ['algorithms-data-structures', 'frontend', 'backend'] },
]

const foundationsRepIds = new Set<string>(paths.find(path => path.id === foundationsPathId)!.stages.flatMap(stage => stage.repIds))

/** A stage made only of Foundations reps is shown once, as a link back to Foundations, instead of repeating it. */
export function stageCoveredByFoundations(pathId: string, repIds: readonly string[]) {
  return pathId !== foundationsPathId && repIds.length > 0 && repIds.every(id => foundationsRepIds.has(id))
}

/** Name the authored task and the next learning step without predicting assessment results. */
export function repPracticeContext(repId: string) {
  const journey = journeys.find(item => [item.guided, item.independent, item.recall].includes(repId))
  const rep = reps.find(item => item.id === repId)
  const summary = rep?.brief?.summary ?? rep?.prompt.split(/(?<=[.!?])\s/)[0] ?? 'Try this rep at your own pace.'
  const nextTitle = (id: string) => reps.find(rep => rep.id === id)?.title ?? id
  const afterward = journey?.guided === repId
    ? `Next: ${nextTitle(journey.independent)} applies the same skill independently.`
    : journey?.independent === repId
      ? `After solving it without hints, return for ${nextTitle(journey.recall)} in ${journey.delayDays} days.`
      : journey?.recall === repId
        ? 'Afterward, review your skill evidence and choose the next unfinished rep on your trail.'
        : 'Afterward, continue to the next unfinished rep in your trail.'
  return { reason: `Next: ${rep?.title ?? 'Your next rep'} — ${summary}`, afterward }
}
