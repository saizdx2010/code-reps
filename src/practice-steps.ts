// The practice loop, in order. Each step shows one section of the coding desk.
export const practiceSteps = [
  { id: 'understand', label: 'Understand', section: 'brief-section' },
  { id: 'plan', label: 'Plan', section: 'plan-section' },
  { id: 'solve', label: 'Solve', section: 'solution-section' },
  { id: 'explain', label: 'Explain', section: 'explain-section' },
  { id: 'review', label: 'Review', section: 'review-section' },
] as const

export const stepSection = (stepId: string) => practiceSteps.find(step => step.id === stepId)!.section

/** The step that shows a section. The checks drawer, and anything unlisted, belongs to Solve. */
export const sectionStep = (section: string): string => practiceSteps.find(step => step.section === section)?.id ?? 'solve'
