import { useMemo } from 'react'
import './milestones.css'
import { Button } from './Button'
import { returningSkipStages } from './curriculum'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import type { LearnerStart } from './learning'
import type { PathId } from './path'
import type { PortableRecord } from './portability'
import { repTitle } from './rep-index.ts'
import { skillStateLabels } from './skill-map'
import { closeout } from './stage-closeout'
import { plural } from './ui-copy.ts'
import { goToView } from './ui-navigation'
import { usePathText } from './useTrailExtras'

type Props = {
  history: PortableRecord[]
  recordId: string
  goalPathId: string
  learnerStart: LearnerStart | null
  onOpenRep: (repId: string) => void
}

const stageName = (number?: number) => (number ? `Stage ${String(number).padStart(2, '0')}` : 'Stage')

/**
 * In the completion panel, once: the stage of the goal track or the whole track that this attempt finished. Worked out
 * from saved attempts (src/stage-closeout.ts), so reopening the finished rep shows it again and nothing is stored.
 */
export function CompletionMilestone({ history, recordId, goalPathId, learnerStart, onOpenRep }: Props) {
  const skip = learnerStart === 'returning' ? returningSkipStages(goalPathId) : 0
  const closed = useMemo(() => closeout(history, recordId, goalPathId, skip), [history, recordId, goalPathId, skip])
  // The recap loads beside the trail; until it arrives, or if it cannot, the block goes without it.
  const text = usePathText()
  if (!closed) return null
  if (closed.kind === 'track')
    return (
      <section className="closeout" aria-labelledby="closeout-title">
        <p className="closeout-label">
          <Icon name="flag" />
          Track complete
        </p>
        <h4 id="closeout-title">{closed.title}</h4>
        <p>
          Every one of its {closed.repCount} reps is completed. Your finish page puts your first and last rep side by side, with the skills
          you reached on the way.
        </p>
        <Button variant="text" onClick={() => goToView('finished', closed.pathId)}>
          See your {closed.title} finish
          <Icon name="arrow" />
        </Button>
      </section>
    )
  const recap = text?.stageTexts[closed.pathId as PathId][closed.title]?.recap
  return (
    <section className="closeout" aria-labelledby="closeout-title">
      <p className="closeout-label">
        <Icon name="flag" />
        {stageName(closed.number)} complete
      </p>
      <h4 id="closeout-title">{closed.title}</h4>
      {recap && <p>{recap}</p>}
      {closed.skills.length > 0 && (
        <>
          <p className="closeout-skills-label" id="closeout-skills-label">
            Skills from this stage
          </p>
          <ul className="closeout-skills" aria-labelledby="closeout-skills-label">
            {closed.skills.map(skill => (
              <li key={skill.id}>
                <span>{skill.title}</span>
                <StatusChip tone={skill.state === 'retained' ? 'success' : 'progress'}>{skillStateLabels[skill.state]}</StatusChip>
              </li>
            ))}
          </ul>
        </>
      )}
      {closed.pending > 0 && (
        <p className="closeout-note">
          {closed.pending} {plural(closed.pending, 'skill')} from this stage {closed.pending === 1 ? 'is' : 'are'} not Independent yet: a
          related rep solved without hints records that. Completing a stage counts finished reps, hints included.
        </p>
      )}
      {closed.next && (
        <Button variant="text" onClick={() => onOpenRep(closed.next!.repId)}>
          Start {stageName(closed.next.number)}: {closed.next.title}
          <span className="visually-hidden"> (first rep: {repTitle(closed.next.repId)})</span>
          <Icon name="arrow" />
        </Button>
      )}
    </section>
  )
}
