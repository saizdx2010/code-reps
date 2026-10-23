import { nextPracticeTime } from './calendar-file.ts'
import type { FluencyState } from './fluency.ts'

// An optional reminder at the practice time on practice days, shown only while Code Reps is open in a tab or as an
// installed app: there is no server or push service, so a closed app cannot remind anyone (the calendar file can).

/** Browsers clamp long timers, so a far-off reminder is re-armed in steps no longer than this. */
const longestWait = 6 * 60 * 60 * 1000

/**
 * Waits for the next practice time and, if nothing has been practiced that day and notifications are allowed, shows
 * one notification. Returns a function that cancels the wait.
 */
export function startReminders(options: { goal: FluencyState['goal']; reason?: string; practicedToday: () => boolean; now?: () => Date }) {
  const now = options.now ?? (() => new Date())
  let timer: ReturnType<typeof setTimeout> | undefined
  const arm = () => {
    const at = nextPracticeTime(options.goal, now())
    if (!at) return
    const wait = at.getTime() - now().getTime()
    timer = setTimeout(
      () => {
        if (
          wait <= longestWait &&
          !options.practicedToday() &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        )
          new Notification('Time for Code Reps', {
            body: options.reason ? `${options.reason} One review counts.` : 'Your practice time. One review counts as a practice day.',
            icon: '/icon-192.png',
            tag: 'code-reps-practice',
          })
        arm()
      },
      Math.min(wait, longestWait) + 1000,
    )
  }
  arm()
  return () => clearTimeout(timer)
}

/**
 * The app's signals outside the page: the installed app's badge shows how many reviews are due, and a reminder (when
 * turned on, as JSON of the goal's days, time, and the learner's reason) waits for the practice time. Returns a
 * function that stops the reminder; the badge stays until the next call sets or clears it.
 */
export function appSignals(options: { dueCount: number; reminder: string; practicedToday: () => boolean }) {
  if ('setAppBadge' in navigator) (options.dueCount ? navigator.setAppBadge(options.dueCount) : navigator.clearAppBadge()).catch(() => {})
  if (!options.reminder) return () => {}
  const { days, time, reason } = JSON.parse(options.reminder) as { days: number[]; time?: string; reason?: string }
  return startReminders({ goal: { pathId: '', minutes: 0, days, time }, reason, practicedToday: options.practicedToday })
}
