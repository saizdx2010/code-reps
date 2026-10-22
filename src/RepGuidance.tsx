import { Button } from './Button'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { InfoNote } from './Layout'
import { getRepGuidance } from './rep-guidance.ts'
import { skillSummariesForRep } from './skill-index.ts'

type Props = {
  repId: string
  history: readonly { repId: string }[]
  openRep: (id: string) => void
  openLesson: (id: string) => void
  /** The note is orientation for Understand; it folds away when the learner moves on, so the brief stays in view. */
  understanding: boolean
}

/** Optional, non-blocking orientation shown before a learner starts a rep. Estimates are guidance only. */
export default function RepGuidance({ repId, history, openRep, openLesson, understanding }: Props) {
  const guidance = useMemo(
    () =>
      getRepGuidance(
        repId,
        history.map(record => record.repId),
      ),
    [repId, history],
  )
  const { checkpoint } = guidance
  // The lessons this rep practices come first; the foundations they build on wait behind one quiet toggle.
  const direct = new Set(
    skillSummariesForRep(repId)
      .slice(0, 2)
      .map(skill => skill.id),
  )
  const directLessons = guidance.lessons.filter(lesson => direct.has(lesson.id))
  const supporting = guidance.lessons.filter(lesson => !direct.has(lesson.id))
  const [showSupporting, setShowSupporting] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const details = root.current?.querySelector('details')
    if (!understanding && details?.open) details.open = false
  }, [understanding])
  const lessonButton = (lesson: { id: string; title: string }) => (
    <Button variant="text" key={lesson.id} onClick={() => openLesson(lesson.id)}>
      {lesson.title}
    </Button>
  )
  return (
    <div ref={root} className="rep-guidance">
      <InfoNote label="About this rep">
        <p>Allow roughly {guidance.effort} for a first attempt. Take the time you need; it is only a guide.</p>
        {directLessons.length > 0 && (
          <div className="guidance-lessons">
            <strong>Before you start</strong>
            {directLessons.map(lessonButton)}
          </div>
        )}
        {supporting.length > 0 && (
          <div className="guidance-lessons">
            <Button
              variant="text"
              className="guidance-more"
              aria-expanded={showSupporting}
              onClick={() => setShowSupporting(!showSupporting)}
            >
              {showSupporting ? 'Hide' : 'Show'} {supporting.length} {supporting.length === 1 ? 'foundation' : 'foundations'} it builds on
              <Icon name="chevron" />
            </Button>
            {showSupporting && supporting.map(lessonButton)}
          </div>
        )}
        {guidance.priorReps.length > 0 && (
          <p>
            <strong>Earlier in this stage:</strong>{' '}
            {guidance.priorReps.map((rep, index) => (
              <span key={rep.id}>
                {index > 0 && ', '}
                <Button variant="text" onClick={() => openRep(rep.id)}>
                  {rep.title}
                </Button>
              </span>
            ))}
          </p>
        )}
        {checkpoint && (
          <div role="note" aria-label="Readiness checkpoint">
            <p>
              <strong>Readiness check:</strong> {checkpoint.message}
            </p>
            <p>
              {checkpoint.bridgeRep && (
                <Button variant="text" onClick={() => openRep(checkpoint.bridgeRep!.id)}>
                  Optional bridge rep: {checkpoint.bridgeRep.title}
                </Button>
              )}
              {checkpoint.bridgeRep && checkpoint.lesson && ' · '}
              {checkpoint.lesson && (
                <Button variant="text" onClick={() => openLesson(checkpoint.lesson!.id)}>
                  Optional lesson: {checkpoint.lesson.title}
                </Button>
              )}
            </p>
          </div>
        )}
      </InfoNote>
    </div>
  )
}
