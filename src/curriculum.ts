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

/**
 * Projects outside Code Reps that end a track. They live in Library → Projects (src/browser-projects.ts); the trail
 * shows them so the track's last step is visible, but never counts them: a self-review is learner-reported evidence.
 */
export const pathExternalProjects: Partial<Record<(typeof paths)[number]['id'], { projectId: string; title: string; reason: string }[]>> = {
  devops: [
    {
      projectId: 'devops-container-ci',
      title: 'Containerize an app and add CI on your own machine',
      reason: 'Package a service you wrote, add health checks and a CI workflow, and record the results in a self-review.',
    },
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
  if (state.recallAt) return `${state.recallDue ? 'Recall ready' : 'Recall available'} ${formatDate(state.recallAt)}.`
  return 'Complete independent practice without hints to schedule recall.'
}

type PathId = (typeof paths)[number]['id']

/** Foundations is the shared root; every other track builds on it. Paths keep their own rep lists for badges and goals. */
export const foundationsPathId: PathId = 'typescript'
export const trackGroups: { title: string; pathIds: PathId[] }[] = [
  { title: 'Then go further', pathIds: ['algorithms-data-structures', 'pattern-recognition', 'frontend', 'sql', 'backend', 'devops'] },
]

/** The track each one builds on, as reading guidance on the track picker. Nothing is locked, dimmed, or reordered by it. */
export const trackBuildsOn: Partial<Record<PathId, PathId>> = { sql: foundationsPathId, backend: 'sql', devops: 'backend' }

const repsOf = (pathId: PathId) => new Set<string>(paths.find(path => path.id === pathId)!.stages.flatMap(stage => stage.repIds))
const foundationsRepIds = repsOf(foundationsPathId)
/** Tracks whose reps other tracks may list as a whole stage, shown there as a link instead of repeated. */
const linkedTracks = new Map<PathId, Set<string>>([
  [foundationsPathId, foundationsRepIds],
  ['sql', repsOf('sql')],
])

/**
 * The track that owns a stage made only of its reps, when that is not the track showing the stage. The stage is drawn as
 * a link to its owner, and its stage badge is earned there; the reps still count toward the showing track's completion.
 */
export function stageHomeTrack(pathId: string, repIds: readonly string[]): PathId | undefined {
  if (!repIds.length) return undefined
  for (const [owner, ids] of linkedTracks) if (owner !== pathId && repIds.every(id => ids.has(id))) return owner
  return undefined
}

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
  return stageHomeTrack(pathId, repIds) === foundationsPathId
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
 * Derived from saved history only; it never predicts or grants anything the records do not show. A rep outside the
 * journeys has nothing to add beyond the attempt's own facts, so it gets no sentence.
 */
export function completionEvidence(repId: string, hintCount: number, progress: JourneyProgress[]): string | undefined {
  const hints = hintCount === 1 ? '1 hint' : `${hintCount} hints`
  const state = progress.find(item => [item.journey.guided, item.journey.independent, item.journey.recall].includes(repId))
  if (!state) return undefined
  const { journey } = state
  if (journey.guided === repId) return `Guided practice done. Next, solve ${repTitle(journey.independent)} without hints.`
  if (hintCount) return `With ${hints}, this attempt is practice, not ${journey.recall === repId ? 'recall' : 'independent'} evidence.`
  if (journey.independent === repId)
    return state.independent?.repId === repId && state.recallAt
      ? `Solved without hints, so this skill is independent. Recall opens ${formatDate(state.recallAt)}.`
      : `Solved without hints. To count as independent, finish ${repTitle(journey.guided)} first, then solve this again without hints.`
  return state.retained
    ? 'Recalled without hints after the break, so this skill is retained.'
    : 'Solved without hints. Recall counts once the break after independent practice has passed.'
}
