import { Button } from './Button'
import { StepIndicator } from './StepIndicator'
import type { View } from './ui-navigation'

const journalPages = [{ view: 'history', label: 'Attempts' }, { view: 'notebook', label: 'Notebook' }] as const

/** One Journal in Progress: completed attempts and notes keep their own routes. */
export function JournalTabs({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return <div className="segmented-control journal-tabs" role="group" aria-label="Journal">
    <StepIndicator active={view} selector="button[aria-pressed=true]" />
    {journalPages.map(page => <Button key={page.view} aria-pressed={view === page.view} onClick={() => onNavigate(page.view)}>{page.label}</Button>)}
  </div>
}
