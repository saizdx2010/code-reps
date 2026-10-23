import { EmptyState, InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { formatDate, plural } from './ui-copy.ts'
import { repTitle } from './rep-index.ts'
import { Button } from './Button'
import { summarizeMistakes, trendWindowDays } from './mistakes'
import { mistakeHelp } from './mistake-help.ts'
import { skillSummaryById } from './skill-index.ts'
import type { MistakeTrend } from './mistakes'
import type { PortableRecord } from './portability'
import { JournalTabs } from './Journal'
import { goToView } from './ui-navigation'

const trendText: Record<MistakeTrend, string> = {
  new: 'New recently',
  more: 'More often recently',
  fewer: 'Less often recently',
  same: 'About the same',
  none: 'None recently',
}

type Props = { history: PortableRecord[]; now: number; onOpenRep: (id: string) => void; onOpenLesson: (skillId: string) => void }

export function MistakesPage({ history, now, onOpenRep, onOpenLesson }: Props) {
  const groups = summarizeMistakes(history, now)
  return (
    <main className="progress-main mistakes-main">
      <PageHeader
        title="Mistakes"
        description="Tags you chose while reviewing finished reps, grouped over time."
        actions={<JournalTabs view="mistakes" onNavigate={goToView} />}
      />
      <InfoNote label="What this shows">
        <p>
          These tags are self-reported and optional. They show what you noticed, not how well you code, and they are not a skill measure.
        </p>
        <p>
          Recent means the last {trendWindowDays} days; earlier means the {trendWindowDays} days before that. Small counts can move a lot.
        </p>
      </InfoNote>
      {groups.length === 0 ? (
        <EmptyState title="No mistakes tagged yet">
          When you review a finished rep, you can tag mistakes you noticed. They will collect here.
        </EmptyState>
      ) : (
        <section aria-label="Mistake tags">
          {groups.map(group => (
            <ListGroup key={group.id} title={group.label} count={group.total}>
              <ListRow
                title={`${group.total} ${plural(group.total, 'time')} in total`}
                meta={`Last ${trendWindowDays} days: ${group.recent}. Before that: ${group.earlier}.`}
                status={<StatusChip tone={group.trend === 'fewer' ? 'success' : 'neutral'}>{trendText[group.trend]}</StatusChip>}
              />
              <ListRow
                title={mistakeHelp[group.id].habit}
                meta="A habit to try next time"
                action={
                  <span className="mistake-lessons">
                    {mistakeHelp[group.id].lessons
                      .map(id => skillSummaryById(id))
                      .filter(skill => skill !== undefined)
                      .map(skill => (
                        <Button key={skill.id} variant="text" onClick={() => onOpenLesson(skill.id)}>
                          Lesson: {skill.title}
                        </Button>
                      ))}
                  </span>
                }
              />
              {group.occurrences.map(item => (
                <ListRow
                  key={item.attemptId}
                  title={repTitle(item.repId)}
                  meta={`Attempt on ${formatDate(item.completedAt)}`}
                  onOpen={() => onOpenRep(item.repId)}
                />
              ))}
            </ListGroup>
          ))}
        </section>
      )}
    </main>
  )
}
