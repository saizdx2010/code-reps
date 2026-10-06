import { Button } from './Button'
import { Textarea } from './Input'
import type { PracticeSession } from './practice-sessions'

export function PracticeSessionPanel({ active, reflection, setReflection, busy, onStart, onEnd, explanation, ended, onHome, onAnother }: {
  active?: PracticeSession; reflection: string; setReflection: (value: string) => void; busy: boolean
  onStart: () => void; onEnd: () => void; explanation: string; ended?: PracticeSession; onHome: () => void; onAnother: () => void
}) {
  return <section className="session-panel" aria-labelledby="session-title">
    <h2 id="session-title">{ended ? 'Session saved' : active ? 'Your practice session' : 'One rep, then reflection'}</h2>
    {ended ? <><p>{ended.attemptId ? 'A completed attempt was recorded during this session.' : 'Your work is saved; this rep may still be incomplete.'} Ending a session does not establish skill evidence.</p><p className="session-reflection">{ended.reflection}</p><div className="session-actions"><Button variant="text" onClick={onHome}>Back to Home</Button><Button onClick={onAnother}>Start another rep</Button></div></> : active ? <>
      <p>Save and leave whenever you need. Add a reflection to explicitly end this session, even if the rep is unfinished.</p>
      <label htmlFor="session-reflection">What did you learn or where did you get stuck?</label>
      <Textarea id="session-reflection" maxLength={2000} value={reflection} onChange={event => setReflection(event.target.value)} rows={3} />
      <div className="session-actions">{explanation.trim() && <Button variant="text" onClick={() => setReflection(explanation.slice(0, 2000))}>Use my explanation as reflection</Button>}<Button variant="primary" disabled={busy || !reflection.trim()} onClick={onEnd}>End session</Button><Button variant="text" onClick={onHome}>Save and leave</Button></div>
    </> : <><p>Opening a rep does not start a session. Start explicitly to keep a practice record, without changing rep completion or recall evidence.</p><Button disabled={busy} onClick={onStart}>Start practice</Button></>}
  </section>
}
