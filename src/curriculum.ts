import { skillSummariesForRep as skillsForRep } from './skill-index.ts'
import { repTitle } from './rep-index.ts'
import { paths } from './path.ts'
import { foundationRepIds } from './catalog-index.ts'
import { journeys, stageLabels } from './learning.ts'
import type { JourneyProgress } from './learning.ts'
import { formatDate } from './ui-copy.ts'

export const pathApplications: Partial<Record<(typeof paths)[number]['id'], { repId: string; reason: string }[]>> = {
  frontend: [
    { repId: 'project-team-directory', reason: 'Combine visible data, request states, and browser interaction in a team directory.' },
  ],
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
  if (state.recallAt) return `${state.recallDue ? 'Recall ready' : 'Recall available'} ${formatDate(state.recallAt)}.`
  return 'Complete independent practice without hints to schedule recall.'
}

type PathId = (typeof paths)[number]['id']

/** Foundations is the shared root; every other track builds on it. Paths keep their own rep lists for badges and goals. */
export const foundationsPathId: PathId = 'typescript'
export const trackGroups: { title: string; pathIds: PathId[] }[] = [
  { title: 'Choose a track', pathIds: ['algorithms-data-structures', 'pattern-recognition', 'frontend', 'sql', 'backend'] },
]

/** The track each one builds on, as reading guidance on the track picker. Nothing is locked, dimmed, or reordered by it. */
export const trackBuildsOn: Partial<Record<PathId, PathId>> = { sql: foundationsPathId, backend: 'sql' }

const foundationsRepIds = new Set<string>(paths.find(path => path.id === foundationsPathId)!.stages.flatMap(stage => stage.repIds))

/**
 * Returning learners skip the language basics: the leading stages made only of the TypeScript foundation reps.
 * The practice plan skips the same reps, so the trail and its recommendation start at the same place.
 */
export function returningSkipStages(pathId: string) {
  if (pathId !== foundationsPathId) return 0
  const stages = paths.find(path => path.id === pathId)!.stages
  const skipped = stages.findIndex(stage => !stage.repIds.every(id => foundationRepIds.includes(id)))
  return skipped === -1 ? 0 : skipped
}

/** A stage made only of Foundations reps is shown once, as a link back to Foundations, instead of repeating it. */
export function stageCoveredByFoundations(pathId: string, repIds: readonly string[]) {
  return pathId !== foundationsPathId && repIds.length > 0 && repIds.every(id => foundationsRepIds.has(id))
}

/** Name the authored task and the next learning step without predicting assessment results. */
export function repPracticeContext(repId: string) {
  const journey = journeys.find(item => [item.guided, item.independent, item.recall].includes(repId))
  const focus = journey?.title ?? skillsForRep(repId)[0]?.title
  const afterward =
    journey?.guided === repId
      ? `Next: ${repTitle(journey.independent)} applies the same skill independently.`
      : journey?.independent === repId
        ? `After solving it without hints, return for ${repTitle(journey.recall)} in ${journey.delayDays} days.`
        : journey?.recall === repId
          ? 'Afterward, review your skill evidence and choose the next unfinished rep on your trail.'
          : 'Afterward, continue to the next unfinished rep in your trail.'
  return { reason: focus ? `Skill: ${focus}.` : 'A good next step on your trail.', afterward }
}

/**
 * What a just-completed attempt counts as, in the same terms the journeys use: hints make it practice, a hint-free
 * independent rep after its guided rep is independent evidence, and a hint-free recall after the break is retention.
 * Derived from saved history only; it never predicts or grants anything the records do not show.
 */
export function completionEvidence(repId: string, hintCount: number, progress: JourneyProgress[]) {
  const hints = hintCount === 1 ? '1 hint' : `${hintCount} hints`
  const chip = hintCount ? { tone: 'neutral' as const, label: hints } : { tone: 'success' as const, label: 'No hints' }
  const state = progress.find(item => [item.journey.guided, item.journey.independent, item.journey.recall].includes(repId))
  if (!state) return { chip, text: hintCount ? `Completed with ${hints}.` : 'Completed without hints.' }
  const { journey } = state
  if (journey.guided === repId) return { chip, text: `Guided practice done. Next, solve ${repTitle(journey.independent)} without hints.` }
  if (hintCount)
    return { chip, text: `With ${hints}, this attempt is practice, not ${journey.recall === repId ? 'recall' : 'independent'} evidence.` }
  if (journey.independent === repId)
    return state.independent?.repId === repId && state.recallAt
      ? { chip, text: `Solved without hints, so this skill is independent. Recall opens ${formatDate(state.recallAt)}.` }
      : {
          chip,
          text: `Solved without hints. To count as independent, finish ${repTitle(journey.guided)} first, then solve this again without hints.`,
        }
  return state.retained
    ? { chip, text: 'Recalled without hints after the break, so this skill is retained.' }
    : { chip, text: 'Solved without hints. Recall counts once the break after independent practice has passed.' }
}
