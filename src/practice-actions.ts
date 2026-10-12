/** The button label for a suggested practice action. */
export const actionLabel = (mode: string) =>
  mode === 'resume' ? 'Continue rep' : mode === 'review' ? 'Start review' : mode === 'retry' ? 'Retry without hints' : 'Start rep'
