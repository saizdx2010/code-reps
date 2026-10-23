import type { Judgment } from './fluency.ts'
import type { View } from './ui-navigation.ts'

/** Pages that open inside the learning hub, in the order the command palette lists them. */
export const hubTabs = ['knowledge', 'notebook', 'plan', 'projects', 'interview', 'assessment'] as const satisfies readonly View[]
export type HubTab = (typeof hubTabs)[number]
export const isHubTab = (view: View): view is HubTab => (hubTabs as readonly View[]).includes(view)

/** Shared by compact loaded and pending PageHeader surfaces. */
export const learningPageTitles: Record<HubTab, { title: string; description: string }> = {
  knowledge: { title: 'Learn a concept', description: 'Read it, trace an example, then put it into practice.' },
  notebook: { title: 'Your notebook', description: 'Keep the ideas and mistakes you want to return to.' },
  plan: { title: 'Make room for practice', description: 'Choose your days and a manageable session budget.' },
  assessment: { title: 'Find your starting point', description: 'Gather evidence, then choose what to practice next.' },
  projects: { title: 'Put your skills together', description: 'Work through a practical project, one milestone at a time.' },
  interview: { title: 'Practice an interview', description: 'A timed round with space to clarify, code, and reflect.' },
}

/** Hub pages reached from another page in their section, and the page their back link returns to. */
export const learningPageBack: Partial<Record<HubTab, { label: string; view: View }>> = {
  plan: { label: 'Skills', view: 'progress' },
  assessment: { label: 'Skills', view: 'progress' },
  interview: { label: 'Projects', view: 'projects' },
}

/** Self-assessment judgments as lessons and the assessment summary name them. */
export const judgmentLabels: Record<Judgment, string> = { 'not-yet': 'Not yet', 'with-help': 'With help', independent: 'Independently' }
