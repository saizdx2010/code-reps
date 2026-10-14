import { Button } from './Button'
import { JournalTabs } from './Journal'
import { EmptyState, InfoNote, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import type { PortableAttempt, PortableRecord } from './portability'
import { getRepGuidance } from './rep-guidance.ts'
import { repTitle } from './rep-index.ts'
import { stuckAdvice, stuckWindowDays, summarizeStuckPoints } from './stuck.ts'
import type { StuckKind, StuckPoint } from './stuck.ts'
import { formatDate, plural } from './ui-copy.ts'
import { goToView } from './ui-navigation'
import { difficultyLabels } from './attempt-labels.ts'

type Props = {
  history: PortableRecord[]
  drafts: Record<string, Pick<PortableAttempt, 'difficulty' | 'completedAt'> | undefined>
  now: number
  onOpenRep: (id: string) => void
  onOpenLesson: (skillId: string) => void
}

/** The lesson most likely to help with one stuck point: a prerequisite for a missing prerequisite, otherwise the linked lesson. */
function helpFor(point: StuckPoint, completed: string[]) {
  const guidance = getRepGuidance(point.repId, completed)
  const lesson = point.kind === 'prerequisite' ? (guidance.checkpoint?.lesson ?? guidance.lessons[0]) : guidance.lessons.at(-1)
  const step = point.kind === 'prerequisite' || point.kind === 'integration' ? guidance.priorReps.at(-1) : undefined
  return { lesson, step }
}

const pointMeta = (point: StuckPoint) => (point.inProgress ? 'Saved draft' : point.at ? `Attempt on ${formatDate(point.at)}` : 'Attempt')

export function StuckPage({ history, drafts, now, onOpenRep, onOpenLesson }: Props) {
  const summary = summarizeStuckPoints(history, drafts, now)
  const completed = [...new Set(history.map(record => record.repId))]
  const focus = summary.focus
  const focusPoint = focus?.points[0]
  const focusHelp = focusPoint && helpFor(focusPoint, completed)
  const focusKind: StuckKind | undefined = focus?.mainKind
  return (
    <main className="progress-main stuck-main">
      <PageHeader
        title="Stuck points"
        eyebrow="Journal"
        description="Where you said a rep was hardest, grouped by kind and by topic."
        actions={<JournalTabs view="stuck" onNavigate={goToView} />}
      />
      <InfoNote label="What this shows">
        <p>
          These come from your optional answer to “What was hardest?” while reviewing a rep, including saved drafts. They show what you
          noticed, not how well you code, and they never change skill evidence.
        </p>
        <p>
          Recent means the last {stuckWindowDays} days; unfinished drafts always count as recent. Use the pattern to choose what to practice
          or which lesson to revisit next.
        </p>
      </InfoNote>
      {summary.total === 0 ? (
        <EmptyState title="No stuck points yet">
          When you review a rep, answer “What was hardest?”. Your answers collect here so you can see where to focus.
        </EmptyState>
      ) : (
        <>
          {focus && focusKind && focusPoint && (
            <section className="stuck-focus" aria-labelledby="stuck-focus-title">
              <span className="home-label">Where to focus next</span>
              <h2 id="stuck-focus-title">{focus.topic}</h2>
              <p>
                {focus.recent} recent {plural(focus.recent, 'stuck point')}, mostly “{difficultyLabels[focusKind].toLowerCase()}”.{' '}
                {stuckAdvice[focusKind]}
              </p>
              <div className="stuck-actions">
                <Button variant="primary" onClick={() => onOpenRep(focusPoint.repId)}>
                  Return to {repTitle(focusPoint.repId)}
                </Button>
                {focusHelp?.lesson && <Button onClick={() => onOpenLesson(focusHelp.lesson!.id)}>Lesson: {focusHelp.lesson.title}</Button>}
                {focusHelp?.step && <Button onClick={() => onOpenRep(focusHelp.step!.id)}>Nearer step: {focusHelp.step.title}</Button>}
              </div>
            </section>
          )}
          <section aria-labelledby="stuck-kinds-title">
            <h2 id="stuck-kinds-title" className="stuck-section-title">
              By kind
            </h2>
            {summary.kinds.map(group => (
              <ListGroup key={group.kind} title={group.label} count={group.total}>
                <ListRow
                  title={stuckAdvice[group.kind]}
                  meta={`Last ${stuckWindowDays} days: ${group.recent}. In total: ${group.total}.`}
                  status={<StatusChip tone={group.recent ? 'attention' : 'neutral'}>{group.recent ? 'Recent' : 'Earlier'}</StatusChip>}
                />
                {group.points.slice(0, 5).map((point, index) => {
                  const help = helpFor(point, completed)
                  return (
                    <ListRow
                      key={`${point.repId}-${point.at ?? 'draft'}-${index}`}
                      title={repTitle(point.repId)}
                      meta={`${pointMeta(point)}${help.lesson ? ` · Lesson: ${help.lesson.title}` : ''}`}
                      onOpen={() => onOpenRep(point.repId)}
                    />
                  )
                })}
              </ListGroup>
            ))}
          </section>
          <section aria-labelledby="stuck-topics-title">
            <h2 id="stuck-topics-title" className="stuck-section-title">
              By topic
            </h2>
            <ul className="list-rows stuck-topics">
              {summary.topics.map(topic => (
                <ListRow
                  key={topic.topic}
                  title={topic.topic}
                  meta={`${topic.total} ${plural(topic.total, 'stuck point')}${topic.mainKind ? ` · Recently: ${difficultyLabels[topic.mainKind]}` : ''}`}
                  status={
                    <StatusChip tone={topic.recent ? 'attention' : 'neutral'}>
                      {topic.recent ? `${topic.recent} recent` : 'Earlier'}
                    </StatusChip>
                  }
                />
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}
