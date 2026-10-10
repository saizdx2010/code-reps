import { EmptyState, InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { formatDate, plural } from './ui-copy.ts'
import { repIndex as reps } from './catalog-index'
import { summarizeMistakes, trendWindowDays } from './mistakes'
import type { MistakeTrend } from './mistakes'
import type { PortableRecord } from './portability'

const trendText: Record<MistakeTrend, string> = { new: 'New recently', more: 'More often recently', fewer: 'Less often recently', same: 'About the same', none: 'None recently' }

export function MistakesPage({ history, now, onOpenRep }: { history: PortableRecord[]; now: number; onOpenRep: (id: string) => void }) {
  const groups = summarizeMistakes(history, now)
  return <main className="progress-main mistakes-main">
    <PageHeader title="Mistakes" eyebrow="Your local learning profile" description="Tags you chose while reviewing finished reps, grouped over time." />
    <InfoNote label="What this shows"><p>These tags are self-reported and optional. They show what you noticed, not how well you code, and they are not a skill measure.</p><p>Recent means the last {trendWindowDays} days; earlier means the {trendWindowDays} days before that. Small counts can move a lot.</p></InfoNote>
    {groups.length === 0 ? <EmptyState title="No mistakes tagged yet">When you review a finished rep, you can tag mistakes you noticed. They will collect here.</EmptyState> : <section aria-label="Mistake tags">
      {groups.map(group => <ListGroup key={group.id} title={group.label} count={group.total}>
        <ListRow title={`${group.total} ${plural(group.total, 'time')} in total`} meta={`Last ${trendWindowDays} days: ${group.recent}. Before that: ${group.earlier}.`} status={<StatusChip tone={group.trend === 'fewer' ? 'success' : 'neutral'}>{trendText[group.trend]}</StatusChip>} />
        {group.occurrences.map(item => <ListRow key={item.attemptId} title={reps.find(rep => rep.id === item.repId)?.title ?? item.repId} meta={`Attempt on ${formatDate(item.completedAt)}`} onOpen={() => onOpenRep(item.repId)} />)}
      </ListGroup>)}
    </section>}
  </main>
}
