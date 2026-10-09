import { useState } from 'react'
import { Button } from './Button'
import { Textarea } from './Input'
import { Icon } from './Icon'
import type { PracticeSession } from './practice-sessions'

export function PracticeSessionPanel({ active, reflection, setReflection, busy, onStart, onEnd, explanation, ended, onHome, onAnother }: {
  active?: PracticeSession; reflection: string; setReflection: (value: string) => void; busy: boolean
  onStart: () => void; onEnd: () => void; explanation: string; ended?: PracticeSession; onHome: () => void; onAnother: () => void
}) {
  const [reflectionOpen, setReflectionOpen] = useState(false)
  return <section className="session-panel" data-state={ended ? 'ended' : active ? 'active' : 'idle'} aria-labelledby="session-title">
    <div className="session-strip">
      <div><h2 id="session-title">{ended ? 'Session saved' : active ? 'Your practice session' : 'Optional practice record'}</h2><span>{ended ? 'Your work is saved; completion is separate.' : active ? 'Practice is active. Your work saves as you go. Completing the rep is separate from ending this session.' : 'Recording is optional. Opening a rep does not record a session, and completing the rep is separate from ending one.'}</span></div>
      {ended ? <div className="session-actions"><Button variant="text" onClick={onHome}>Back to Home</Button><Button onClick={onAnother}>Start another rep</Button></div> : active ? <Button aria-expanded={reflectionOpen} aria-controls="session-ending" onClick={() => setReflectionOpen(!reflectionOpen)}>Reflect and end session<Icon name="chevron" /></Button> : <Button disabled={busy} onClick={onStart}>Record a session</Button>}
    </div>
    {ended ? <details className="session-record"><summary>View session reflection</summary><p>{ended.attemptId ? 'A completed attempt was recorded during this session.' : 'This rep may still be incomplete.'} Ending a session does not establish skill evidence.</p><p className="session-reflection">{ended.reflection}</p></details> : active ? <details id="session-ending" open={reflectionOpen}><summary hidden>Session reflection</summary><div className="session-ending">
      <p>Add a reflection to end this session, even if the rep is unfinished. Ending a session does not complete the rep.</p>
      <label htmlFor="session-reflection">What did you learn or where did you get stuck?</label>
      <Textarea id="session-reflection" maxLength={2000} value={reflection} onChange={event => setReflection(event.target.value)} rows={3} />
      <div className="session-actions">{explanation.trim() && <Button variant="text" onClick={() => setReflection(explanation.slice(0, 2000))}>Use my explanation as reflection</Button>}<Button variant="primary" disabled={busy || !reflection.trim()} onClick={onEnd}>End session</Button><Button variant="text" onClick={onHome}>Save and leave</Button></div>
    </div></details> : null}
  </section>
}
