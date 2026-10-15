/** The button label for a suggested practice action. */
export const actionLabel = (mode: string) =>
  mode === 'resume' ? 'Continue rep' : mode === 'review' ? 'Start review' : mode === 'retry' ? 'Retry without hints' : 'Start rep'

/** A recommendation's reason without the goal sentence, for places that already show the goal. */
export const withoutGoal = (reason: string) => reason.replace(/\s*Build toward your selected (learning goal|track)(: [^.]+)?\./, '').trim()
