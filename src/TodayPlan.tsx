import { Button } from './Button'
import { useEffect, useState } from 'react'
import { preloadPractice } from './editor-loader'
import { Icon } from './Icon'
import { ListRow, StatusChip } from './Layout'
import type { PortableRecord } from './portability'
import type { getPracticePlan } from './practice'
import { dayNumber } from './profile-progress'
import { repTitle } from './rep-index.ts'
import { setOrder, todayPlan } from './today-plan'
import type { TodayItem } from './today-plan'
import type { SetItem } from './warmup'
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
  nextRepId,
  where,
  onOpen,
  onAllReviews,
  onStartSet,
  warmup,
  startWarmup,
  onCloseDay,
}: {
  history: PortableRecord[]
  now: number
  practicePlan: Pick<ReturnType<typeof getPracticePlan>, 'next' | 'recommended' | 'due'>
  hasNext: boolean
  /** The rep the panel above recommends; its row here says so instead of repeating its due state. */
  nextRepId?: string
  where: (repId: string) => string
  onOpen: (item: TodayItem) => void
  onAllReviews: () => void
  onStartSet: (items: SetItem[]) => void
  /** Earlier Beginner reps for a quick warm-up (src/warmup.ts). */
  warmup: string[]
  startWarmup: () => void
  /** Ends the day on Trail: what today held and the rep for next time. */
  onCloseDay: () => void
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
  // The smallest day that still counts: before anything is finished today, one due review (or one short rep finished
  // before) is offered on its own, since any completed attempt makes a practice day.
  const practicedToday = history.some(record => dayNumber(new Date(record.completedAt)) === day)
  const oneReview = practicePlan.due[0]
  const oneRep = oneReview?.repId ?? warmup[0]
  // When the panel above already offers a review, it is the small step; this line is for a day that starts with a new rep.
  const smallest = !practicedToday && oneRep && practicePlan.next?.mode !== 'review' && oneRep !== nextRepId && (
    <p className="today-one">
      <span>Short on time? One {oneReview ? 'review' : 'short rep'} still makes today a practice day.</span>
      <Button
        variant="text"
        onMouseEnter={() => preloadPractice(oneRep)}
        onFocus={() => preloadPractice(oneRep)}
        onClick={() =>
          onOpen({ repId: oneRep, kind: 'review', done: false, action: oneReview ?? { repId: oneRep, reason: '', mode: 'review' } })
        }
      >
        Just one {oneReview ? 'review' : 'rep'}: {repTitle(oneRep)}
        <Icon name="arrow" />
      </Button>
    </p>
  )
  const set = setOrder(plan.items)
  // Offered beside Today's plan; on its own when there is no plan to show.
  // One quiet line, not a third card: the reps it holds are named once it starts.
  const warmupPanel = warmup.length >= 2 && (
    <section className="warmup-panel" aria-labelledby="warmup-heading">
      <div>
        <h2 id="warmup-heading">Quick warm-up</h2>
        <p title={warmup.map(repTitle).join(', ')}>{warmup.length} short reps you finished before</p>
      </div>
      <Button
        variant="text"
        onMouseEnter={() => preloadPractice(warmup[0])}
        onFocus={() => preloadPractice(warmup[0])}
        onClick={startWarmup}
      >
        Start warm-up
        <Icon name="arrow" />
      </Button>
    </section>
  )
  if (!plan.shown)
    return warmupPanel || smallest ? (
      <>
        {warmupPanel}
        {smallest}
      </>
    ) : null
  return (
    <>
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
                item.done ? (
                  <StatusChip tone="success">Done</StatusChip>
                ) : item.repId === nextRepId ? (
                  <StatusChip tone="progress">Up next</StatusChip>
                ) : (
                  <StatusChip tone={item.kind === 'review' ? 'attention' : 'neutral'}>{item.kind === 'review' ? 'Due' : 'New'}</StatusChip>
                )
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
        {set.length >= 2 && (
          <p className="today-set">
            {/* The panel above holds the one primary action; the set is the secondary way through all of Today. */}
            <Button
              onMouseEnter={() => preloadPractice(set[0].repId)}
              onFocus={() => preloadPractice(set[0].repId)}
              onClick={() => onStartSet(set)}
            >
              <Icon name="play" />
              Start set
            </Button>
            <span>
              {set.some(item => item.kind === 'review') && set.some(item => item.kind === 'new')
                ? 'Reviews first, then the new rep, one after another.'
                : 'One after another.'}
            </span>
          </p>
        )}
        {plan.complete && (
          <p className={`today-done${fresh.size ? ' is-fresh' : ''}`}>
            <Icon name="check" />
            <span>
              <strong>Today's practice is done.</strong>{' '}
              {hasNext ? 'You can stop here; the next rep above is there if you want more.' : 'You can stop here.'}
            </span>
            <Button variant="text" onClick={onCloseDay}>
              Finish for today
            </Button>
          </p>
        )}
      </section>
      {warmupPanel}
      {smallest}
    </>
  )
}
