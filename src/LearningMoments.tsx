import { Button } from './Button'
import { useEffect, useMemo } from 'react'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { personalBest } from './personal-best'
import type { PersonalBest } from './personal-best'
import type { PortableRecord } from './portability'
import { parseStepKeys, skillStateLabels, skillStepKey, skillSteps } from './skill-map'
import type { SkillState, SkillStep } from './skill-map'
import { NewPartNotice } from './ToyRewards'
import { formatDate, plural } from './ui-copy'
import type { ChipTone } from './ui-status'
import { useSessionPreference } from './useSessionPreference'

export type Moments = {
  history: PortableRecord[]
  recordId: string
  now: number
  /** The rep was completed in this view, so its steps are new and the skill map should replay them once. */
  fresh: boolean
  onSkillMap: () => void
}

/**
 * What one completed attempt shows about growth, in the completion panel: the skills it moved up, at most one personal
 * best, and a toy part it lit for the first time. All are worked out from saved attempts, so nothing is stored and
 * backups are unchanged.
 */
export default function LearningMoments({ history, recordId, now, fresh, onSkillMap }: Moments) {
  // Worked out once per saved history, not on every keystroke elsewhere in the completion panel.
  const steps = useMemo(() => skillSteps(history, recordId, now), [history, recordId, now])
  const best = useMemo(() => personalBest(history, recordId, now), [history, recordId, now])
  const [pending, setPending] = useSessionPreference<string>('skill-steps-pending', '[]')
  const keys = fresh ? steps.map(step => skillStepKey(step.id, step.to)).join(' ') : ''
  useEffect(() => {
    const queued = parseStepKeys(pending)
    const added = keys.split(' ').filter(key => key && !queued.includes(key))
    if (added.length) setPending(JSON.stringify([...queued, ...added]))
  }, [keys, pending, setPending])
  return (
    <>
      <SkillStepNotice steps={steps} onSkillMap={onSkillMap} />
      <PersonalBestNote best={best} />
      <NewPartNotice history={history} recordId={recordId} fresh={fresh} />
    </>
  )
}

// The same tones as the skill map, so a step reads the same in both places.
const tones: Record<SkillState, ChipTone> = {
  untouched: 'neutral',
  practiced: 'progress',
  independent: 'progress',
  retained: 'success',
  due: 'attention',
}

/** The skills this attempt moved up, in the completion panel. Static: it describes the saved attempt. */
function SkillStepNotice({ steps, onSkillMap }: { steps: SkillStep[]; onSkillMap: () => void }) {
  if (steps.length === 0) return null
  return (
    <div className="skill-step-notice">
      <div className="skill-step-copy">
        <p className="skill-step-label">{steps.length === 1 ? 'Skill moved up' : 'Skills moved up'}</p>
        <ul>
          {steps.map(step => (
            <li key={step.id}>
              <span className="skill-step-title">{step.title}</span>
              <span className="skill-step-change">
                <StatusChip tone={tones[step.from]}>{skillStateLabels[step.from]}</StatusChip>
                <Icon name="arrow" />
                <span className="visually-hidden"> to </span>
                <StatusChip tone={tones[step.to]}>{skillStateLabels[step.to]}</StatusChip>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Button variant="text" onClick={onSkillMap}>
        See skill map
        <Icon name="arrow" />
      </Button>
    </div>
  )
}

const hints = (count: number) => `${count} ${plural(count, 'hint')}`

/** At most one note comparing this attempt with the learner's own earlier work. */
function PersonalBestNote({ best }: { best: PersonalBest | null }) {
  if (!best) return null
  const [icon, label, text] =
    best.kind === 'recall'
      ? (['repeat', 'Recall held:', `solved without hints ${best.days} days after your independent rep.`] as const)
      : best.kind === 'no-hints'
        ? ([
            'flag',
            'Personal best:',
            `no hints this time. Last time on this ${best.scope} you used ${hints(best.previousHints)}.`,
          ] as const)
        : (['hint', 'Fewer hints:', `${best.hints} this time, down from ${best.previousHints} on ${formatDate(best.previousAt)}.`] as const)
  return (
    <p className="personal-best">
      <Icon name={icon} />
      <span>
        <strong>{label}</strong> {text}
      </span>
    </p>
  )
}
