export type HubTab = 'knowledge' | 'assessment' | 'plan' | 'notebook' | 'projects' | 'interview'

/** Shared by compact loaded and pending PageHeader surfaces. */
export const learningPageTitles: Record<HubTab, { title: string; description: string }> = {
  knowledge: { title: 'Learn a concept.', description: 'Read it, trace an example, then put it into practice.' },
  notebook: { title: 'Your notebook.', description: 'Keep the ideas and mistakes you want to return to.' },
  plan: { title: 'Make room for practice.', description: 'Choose your days and a manageable session budget.' },
  assessment: { title: 'Find your starting point.', description: 'Gather evidence, then choose what to practice next.' },
  projects: { title: 'Put your skills together.', description: 'Work through a practical project, one milestone at a time.' },
  interview: { title: 'Practice an interview.', description: 'A timed round with space to clarify, code, and reflect.' },
}

