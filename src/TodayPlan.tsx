import { Button } from './Button'
import { useEffect, useState } from 'react'
import { preloadPractice } from './editor-loader'
import { Icon } from './Icon'
import { ListRow, StatusChip } from './Layout'
import type { PortableRecord } from './portability'
import type { getPracticePlan } from './practice'
import { dayNumber } from './profile-progress'
import { repTitle } from './rep-index.ts'
import { todayPlan } from './today-plan'
import type { TodayItem } from './today-plan'
import { useSessionPreference } from './useSessionPreference'

type TodaySeen = { day: number; done: string[] }
function readSeen(value: string): TodaySeen | null {
  try {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { day, done } = parsed as Partial<TodaySeen>
    return typeof day === 'number' && Array.isArray(done) ? { day, done: done.filter(id => typeof id === 'string') } : null
  } catch {
    return null
  }
}

/**
 * Today's plan on Trail: one new rep and the reviews that are due, each done once an attempt for it is completed today.
 * Items finished since the last visit this session pop their check in and fill their meter segment once; the record
 * of what was shown is session UI state, so it never enters backups. Without a record, arriving never replays earlier work.
 */
export default function TodayPlan({
  history,
  now,
  practicePlan,
  hasNext,
  where,
  onOpen,
  onAllReviews,
}: {
  history: PortableRecord[]
  now: number
  practicePlan: Pick<ReturnType<typeof getPracticePlan>, 'next' | 'recommended' | 'due'>
  hasNext: boolean
  where: (repId: string) => string
  onOpen: (item: TodayItem) => void
  onAllReviews: () => void
}) {
  const plan = todayPlan(history, practicePlan, new Date(now))
  const day = dayNumber(new Date(now))
  const doneIds = plan.items.filter(item => item.done).map(item => item.repId)
  const [seenValue, setSeen] = useSessionPreference<string>('today-seen', '')
  const [fresh] = useState(() => {
    const seen = readSeen(seenValue)
    if (!seen) return new Set<string>()
    return new Set(doneIds.filter(id => seen.day !== day || !seen.done.includes(id)))
  })
  const record = JSON.stringify({ day, done: doneIds })
  useEffect(() => {
    if (seenValue !== record) setSeen(record)
  }, [record, seenValue, setSeen])
  const isFresh = (item: TodayItem) => item.done && fresh.has(item.repId)
  if (!plan.shown) return null
  return (
    <section className="today-plan" aria-labelledby="today-heading">
      <div className="today-plan-head">
        <h2 id="today-heading">Today</h2>
        <span className="today-plan-count">
          {plan.done} of {plan.items.length} done
        </span>
        <span className="today-meter" aria-hidden="true">
          {plan.items.map(item => (
            <span key={item.repId} data-done={item.done || undefined} className={isFresh(item) ? 'is-fresh' : undefined} />
          ))}
        </span>
      </div>
      <ul className="list-rows today-rows">
        {plan.items.map(item => (
          <ListRow
            key={item.repId}
            className={item.done ? 'is-done' : undefined}
            marker={
              <span className={`today-mark${isFresh(item) ? ' is-fresh' : ''}`} data-done={item.done || undefined}>
                {item.done && <Icon name="check" />}
              </span>
            }
            title={repTitle(item.repId)}
            meta={`${item.kind === 'new' ? 'New rep' : 'Review'} · ${where(item.repId)}`}
            status={
              <StatusChip tone={item.done ? 'success' : item.kind === 'review' ? 'attention' : 'neutral'}>
                {item.done ? 'Done' : item.kind === 'review' ? 'Due' : 'New'}
              </StatusChip>
            }
            onOpen={() => onOpen(item)}
            onPreview={() => preloadPractice(item.repId)}
          />
        ))}
      </ul>
      {plan.moreDue > 0 && (
        <p className="today-more">
          <Button variant="text" onClick={onAllReviews}>
            See all {plan.moreDue + plan.items.filter(item => item.kind === 'review' && !item.done).length} due reviews
            <Icon name="arrow" />
          </Button>
        </p>
      )}
      {plan.complete && (
        <p className={`today-done${fresh.size ? ' is-fresh' : ''}`}>
          <Icon name="check" />
          <span>
            <strong>Today's practice is done.</strong>{' '}
            {hasNext ? 'You can stop here; the next rep above is there if you want more.' : 'You can stop here.'}
          </span>
        </p>
      )}
    </section>
  )
}
