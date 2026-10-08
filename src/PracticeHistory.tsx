import { useState } from 'react'
import { useSessionPreference } from './useSessionPreference'
import { Button } from './Button'
import { Textarea } from './Input'
import { reps } from './rep'
import type { PracticeSession } from './practice-sessions'
import type { PortableRecord } from './portability'

export function PracticeHistory({ hasDraft, records, activeId, reflection, setReflection, remove, resume, openDraft, openAttempt, history }: {
  hasDraft: (repId: string) => boolean; records: PracticeSession[]; activeId: string | null; reflection: (id: string) => string; setReflection: (id: string, value: string) => void
  remove: (id: string) => void; resume: (repId: string) => void; openDraft: (repId: string) => void; openAttempt: (record: PortableRecord) => void; history: PortableRecord[]
}) {
  const [tab, setTab] = useSessionPreference<'ended' | 'unfinished'>('session-history-view', 'ended')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const visible = records.filter(record => Boolean(record.endedAt) === (tab === 'ended'))
  return <main className="progress-main"><div className="home-heading"><h1 tabIndex={-1}>Practice history</h1><p>Sessions record effort and reflection. Completed-attempt History holds code snapshots and skill evidence.</p></div>
    <div className="segmented-control" role="group" aria-label="Session history view"><Button aria-pressed={tab === 'ended'} onClick={() => setTab('ended')}>Ended</Button><Button aria-pressed={tab === 'unfinished'} onClick={() => setTab('unfinished')}>Unfinished</Button></div>
    {!visible.length && <p>No {tab} sessions yet. Start practice explicitly from Home or a rep.</p>}
    <ul className="session-history">{visible.map(record => {
      const rep = reps.find(rep => rep.id === record.repId)!
      const attempt = history.find(attempt => attempt.id === record.attemptId && attempt.repId === record.repId)
      return <li key={record.id}><h2>{rep.title}</h2><p>Started {new Date(record.startedAt).toLocaleString()}{record.endedAt ? ` · Ended ${new Date(record.endedAt).toLocaleString()}` : record.id === activeId ? ' · Active here' : ' · Unfinished'}</p>
        <p>{record.hintCount} hint(s) visible in the attempt{record.difficulty ? ` · Difficulty: ${record.difficulty.replaceAll('-', ' ')}` : ''}. {record.attemptId ? 'An attempt was completed during this session.' : 'No completed attempt was recorded in this session.'}</p>
        {editing === record.id ? <><label htmlFor={`reflection-${record.id}`}>Session reflection</label><Textarea id={`reflection-${record.id}`} value={reflection(record.id)} maxLength={2000} rows={3} onChange={event => setReflection(record.id, event.target.value)} /><Button variant="text" onClick={() => setEditing(null)}>Done editing</Button></> : <><p className="session-reflection">{reflection(record.id) || 'No reflection added.'}</p><Button variant="text" onClick={() => setEditing(record.id)}>Edit reflection</Button></>}
        <div className="session-actions">{!record.endedAt && <Button onClick={() => resume(record.repId)}>Resume in a new session</Button>}
          {record.attemptId ? attempt ? <Button variant="text" onClick={() => openAttempt(attempt)}>View recorded attempt</Button> : <><p>The original recorded work is unavailable.</p><Button variant="text" onClick={() => openDraft(record.repId)}>Open rep</Button></> : hasDraft(record.repId) ? <Button variant="text" onClick={() => openDraft(record.repId)}>Open current work</Button> : <><p>The original draft is unavailable.</p><Button variant="text" onClick={() => openDraft(record.repId)}>Open rep</Button></>}
          <Button variant="text" onClick={() => setDeleting(record.id)}>{record.endedAt ? 'Delete record…' : 'Discard session…'}</Button></div>
        {!record.attemptId && <p className="utility-note">Current work may have changed since this session. This is not a historical code snapshot.</p>}
        {deleting === record.id && <div className="delete-confirm"><p>Remove this session and its reflection? Your code draft and completed attempts will stay.</p><Button variant="danger" onClick={() => { remove(record.id); setDeleting(null) }}>Remove session record</Button><Button variant="text" onClick={() => setDeleting(null)}>Keep record</Button></div>}
      </li>
    })}</ul>
  </main>
}
