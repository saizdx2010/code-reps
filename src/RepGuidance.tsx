import { useMemo } from 'react'
import { InfoNote } from './Layout'
import { getRepGuidance } from './rep-guidance.ts'

type Props = { repId: string; history: readonly { repId: string }[]; openRep: (id: string) => void; openLesson: (id: string) => void }

/** Optional, non-blocking orientation shown before a learner starts a rep. Estimates are guidance only. */
export default function RepGuidance({ repId, history, openRep, openLesson }: Props) {
  const guidance = useMemo(() => getRepGuidance(repId, history.map(record => record.repId)), [repId, history])
  const { checkpoint } = guidance
  return <InfoNote label="Time and helpful foundations">
    <p><strong>Allow roughly:</strong> {guidance.effort}. Take the time you need; this is only a guide for your first attempt.</p>
    {guidance.lessons.length > 0 && <p><strong>Helpful to know:</strong> {guidance.lessons.map((lesson, index) => <span key={lesson.id}>{index > 0 && ', '}<button type="button" className="text-button" onClick={() => openLesson(lesson.id)}>{lesson.title}</button></span>)}</p>}
    {guidance.priorReps.length > 0 && <p><strong>Earlier in this stage:</strong> {guidance.priorReps.map((rep, index) => <span key={rep.id}>{index > 0 && ', '}<button type="button" className="text-button" onClick={() => openRep(rep.id)}>{rep.title}</button></span>)}</p>}
    {checkpoint && <div role="note" aria-label="Readiness checkpoint"><p><strong>Before you start:</strong> {checkpoint.message}</p>
      <p>{checkpoint.bridgeRep && <button type="button" className="text-button" onClick={() => openRep(checkpoint.bridgeRep!.id)}>Optional bridge rep: {checkpoint.bridgeRep.title}</button>}{checkpoint.bridgeRep && checkpoint.lesson && ' · '}{checkpoint.lesson && <button type="button" className="text-button" onClick={() => openLesson(checkpoint.lesson!.id)}>Optional lesson: {checkpoint.lesson.title}</button>}</p></div>}
  </InfoNote>
}
