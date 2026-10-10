import { formatDate, plural } from './ui-copy.ts'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { PageHeader } from './Layout'
import { useSessionPreference } from './useSessionPreference'
import { Button } from './Button'
import { StepIndicator } from './StepIndicator'
import { Textarea } from './Input'
import { repIndex as reps } from './catalog-index'
import type { PracticeSession } from './practice-sessions'
import type { PortableRecord } from './portability'

export function PracticeHistory({ journalTabs, hasDraft, records, activeId, reflection, setReflection, remove, resume, openDraft, openAttempt, history }: {
  journalTabs?: ReactNode; hasDraft: (repId: string) => boolean; records: PracticeSession[]; activeId: string | null; reflection: (id: string) => string; setReflection: (id: string, value: string) => void
  remove: (id: string) => void; resume: (repId: string) => void; openDraft: (repId: string) => void; openAttempt: (record: PortableRecord) => void; history: PortableRecord[]
}) {
  const [tab, setTab] = useSessionPreference<'ended' | 'unfinished'>('session-history-view', 'ended')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const visible = records.filter(record => Boolean(record.endedAt) === (tab === 'ended'))
  return <main className="progress-main"><PageHeader eyebrow="Journal" title="Practice history" description="Look back at your practice time and reflections. Your completed attempts keep the code you wrote." actions={journalTabs} />
    <div className="segmented-control" role="group" aria-label="Session history view"><StepIndicator active={tab} selector="button[aria-pressed=true]" /><Button aria-pressed={tab === 'ended'} onClick={() => setTab('ended')}>Ended</Button><Button aria-pressed={tab === 'unfinished'} onClick={() => setTab('unfinished')}>Unfinished</Button></div>
    {!visible.length && <p>No {tab} sessions yet. Choose “Record a session” on Trail or in a rep when you want to track your time.</p>}
    <ul className="session-history">{visible.map(record => {
      const rep = reps.find(rep => rep.id === record.repId)!
      const attempt = history.find(attempt => attempt.id === record.attemptId && attempt.repId === record.repId)
      return <li key={record.id}><h2>{rep.title}</h2><p>Started {formatDate(record.startedAt, true)}{record.endedAt ? ` · Ended ${formatDate(record.endedAt, true)}` : record.id === activeId ? ' · Active here' : ' · Unfinished'}</p>
        <p>{record.hintCount} {plural(record.hintCount, 'hint')} visible in the attempt{record.difficulty ? ` · Difficulty: ${record.difficulty.replaceAll('-', ' ')}` : ''}. {record.attemptId ? 'You completed an attempt in this session.' : 'You did not complete an attempt in this session.'}</p>
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
