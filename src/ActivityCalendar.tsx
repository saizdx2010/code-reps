import { useLayoutEffect, useRef } from 'react'
import { activityCalendar, activityLevel } from './profile-progress'
import type { PortableRecord } from './portability'
import { formatDate, plural } from './ui-copy.ts'

// The first label sits beside the month row; the rest line up with Sunday to Saturday.
const weekdayLabels = ['', '', 'Mon', '', 'Wed', '', 'Fri', '']

/** Completed attempts per day as a grid of weeks. Counts are also given in text, so the shading is never the only signal. */
export function ActivityCalendar({ history, now }: { history: PortableRecord[]; now: number }) {
  const weeks = 20
  const scroller = useRef<HTMLDivElement>(null)
  // On narrow screens the grid scrolls; start at the newest week, which matters most.
  useLayoutEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth
  }, [])
  const calendar = activityCalendar(history, new Date(now), weeks)
  const label = (date: string) => formatDate(`${date}T12:00:00`)
  const summary = calendar.total
    ? `In the last ${weeks} weeks you completed ${calendar.total} ${plural(calendar.total, 'attempt')} on ${calendar.activeDays} ${plural(calendar.activeDays, 'day')}.${calendar.busiest ? ` Your busiest day was ${label(calendar.busiest.date)}, with ${calendar.busiest.count}.` : ''}`
    : `No completed attempts in the last ${weeks} weeks yet. Each finished rep fills in its day.`
  return (
    <section className="activity-calendar" aria-labelledby="activity-title">
      <h2 id="activity-title">Practice calendar</h2>
      <p>{summary}</p>
      <div
        ref={scroller}
        className="activity-scroll"
        role="group"
        aria-label="Practice calendar grid, scroll sideways for earlier weeks if clipped"
        tabIndex={0}
      >
        <div className="activity-body" aria-hidden="true">
          <div className="activity-weekdays">
            {weekdayLabels.map((day, index) => (
              <span key={index}>{day}</span>
            ))}
          </div>
          <div className="activity-weeks">
            {calendar.weeks.map(week => {
              const month = week.find(day => day.date.endsWith('-01')) ?? (calendar.weeks[0] === week ? week[0] : undefined)
              return (
                <div key={week[0].date} className="activity-week">
                  <span className="activity-month">
                    {month ? new Date(`${month.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }) : ''}
                  </span>
                  {week.map(day => (
                    <span
                      key={day.date}
                      className="activity-cell"
                      data-level={day.future ? 'future' : activityLevel(day.count)}
                      title={day.future ? undefined : `${label(day.date)}: ${day.count} ${plural(day.count, 'attempt')}`}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <p className="activity-legend" aria-hidden="true">
        Fewer
        {[0, 1, 2, 3, 4].map(level => (
          <span key={level} className="activity-cell" data-level={level} />
        ))}
        More
      </p>
    </section>
  )
}
