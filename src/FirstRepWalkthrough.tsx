import { Button } from './Button'
import './walkthrough.css'

const steps: Record<string, { title: string; text: string; next?: string; action?: string }> = {
  understand: {
    title: '1 of 5 · Understand',
    text: 'Read the brief and example below. This is a real rep: you will write and check your own code.',
    next: 'plan-section',
    action: 'Walkthrough: plan next',
  },
  plan: {
    title: '2 of 5 · Plan',
    text: 'Write a few words in Your plan before coding. Your writing is saved as you go.',
    next: 'solution-section',
    action: 'Walkthrough: solve next',
  },
  solve: {
    title: '3 of 5 · Solve',
    text:
      'Edit the starter, then use Run checks below. Read failed cases and try again. ' +
      'Hints are optional in Understand; revealing one records hint use.',
    next: 'explain-section',
    action: 'Walkthrough: explain next',
  },
  explain: {
    title: '4 of 5 · Explain',
    text: 'Use Your explanation to describe what your code does and why. Then compare your reasoning with the review guide.',
    next: 'review-section',
    action: 'Walkthrough: finish next',
  },
  review: {
    title: '5 of 5 · Finish',
    text: 'Check what is still needed, then Complete rep to save your attempt. Reflecting on difficulty and confidence is optional.',
  },
}

/** Contextual orientation only: never writes learner work or changes assessment. */
export function FirstRepWalkthrough({
  step,
  completed,
  onNext,
  onDismiss,
}: {
  step: string
  completed: boolean
  onNext: (section: string) => void
  onDismiss: () => void
}) {
  const help = steps[step] ?? steps.understand
  const saved = completed && step === 'review'
  return (
    <aside className="first-rep-walkthrough" aria-label="First rep walkthrough">
      <strong>{saved ? 'Your attempt is saved' : help.title}</strong>
      <p tabIndex={step === 'solve' ? 0 : undefined}>
        {saved ? 'Use Next rep above to keep going, or Done for today to stop here. Your work stays saved.' : help.text}
      </p>
      <div>
        {help.next && (
          <Button variant="text" onClick={() => onNext(help.next!)}>
            {help.action}
          </Button>
        )}
        <Button variant="text" onClick={onDismiss}>
          {step === 'review' ? 'Finish walkthrough' : 'Skip walkthrough'}
        </Button>
      </div>
    </aside>
  )
}
