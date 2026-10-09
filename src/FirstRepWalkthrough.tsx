import { Button } from './Button'
import './walkthrough.css'

const steps: Record<string, { title: string, text: string, next?: string, action?: string }> = {
  understand: { title: '1 of 5 · Understand', text: 'Read the brief and example below. This is a real rep: you will write and check your own code.', next: 'plan-section', action: 'Walkthrough: plan next' },
  plan: { title: '2 of 5 · Plan', text: 'Write a few words in Your plan before coding. The app saves your writing; you review its quality yourself.', next: 'solution-section', action: 'Walkthrough: solve next' },
  solve: { title: '3 of 5 · Solve', text: 'Edit the starter, then use Run checks below. Read failed cases and try again. Hints are optional in Understand; revealing one records hint use.', next: 'explain-section', action: 'Walkthrough: explain next' },
  explain: { title: '4 of 5 · Explain', text: 'Use Your explanation to describe what your code does and why. Passing checks verifies behavior; it does not assess this writing.', next: 'review-section', action: 'Walkthrough: review next' },
  review: { title: '5 of 5 · Review', text: 'Review the completion checklist, choose difficulty and confidence, then Complete rep when ready. Finishing this guide alone records no attempt or mastery.' },
}

/** Contextual orientation only: never writes learner work or changes assessment. */
export function FirstRepWalkthrough({ step, completed, onNext, onDismiss }: {
  step: string
  completed: boolean
  onNext: (section: string) => void
  onDismiss: () => void
}) {
  const help = steps[step] ?? steps.understand
  const saved = completed && step === 'review'
  return <aside className="first-rep-walkthrough" aria-label="First rep walkthrough">
    <strong>{saved ? 'Your attempt is saved' : help.title}</strong>
    <p tabIndex={step === 'solve' ? 0 : undefined}>{saved ? 'You can revisit your work or choose another rep. Independent fluency and retention need their own evidence.' : help.text}</p>
    <div>{help.next && <Button variant="text" onClick={() => onNext(help.next!)}>{help.action}</Button>}<Button variant="text" onClick={onDismiss}>{step === 'review' ? 'Finish walkthrough' : 'Skip walkthrough'}</Button></div>
  </aside>
}
