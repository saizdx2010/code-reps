import type { FluencyState } from './fluency.ts'

// A calendar file is the one bridge out of Code Reps that works while it is closed: the learner's own calendar does the
// reminding. Nothing is sent anywhere; the file is built from the saved practice goal and downloaded.

const weekdayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const pad = (value: number) => String(value).padStart(2, '0')
const localStamp = (date: Date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`
const utcStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
/** RFC 5545 text: backslashes, semicolons, commas, and line breaks are escaped. */
const icsText = (value: string) => value.replace(/[\\;,]/g, match => `\\${match}`).replace(/\r?\n/g, '\\n')
/** RFC 5545 lines are folded at 75 octets; continuation lines start with a space. */
function fold(line: string) {
  const bytes = new TextEncoder()
  const parts: string[] = []
  let current = ''
  for (const character of line) {
    if (bytes.encode(current + character).length > (parts.length ? 74 : 75)) {
      parts.push(current)
      current = ''
    }
    current += character
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** The first chosen practice day at or after now (today counts if its time has not passed), at the practice time. */
export function nextPracticeTime(goal: FluencyState['goal'], now = new Date()) {
  if (!goal.days.length) return null
  const [hours, minutes] = (goal.time ?? '19:00').split(':').map(Number)
  for (let offset = 0; offset <= 7; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hours, minutes)
    if (goal.days.includes(date.getDay()) && date.getTime() > now.getTime()) return date
  }
  return null
}

/**
 * A calendar file (iCalendar) with one weekly event on each chosen practice day, at the practice time and for the
 * session length. Times are floating local times, so the calendar shows them at that clock time wherever it is.
 */
export function calendarFile(goal: FluencyState['goal'], options: { reason?: string; url: string; now?: Date }) {
  const now = options.now ?? new Date()
  const start = nextPracticeTime(goal, now)
  if (!start) return null
  const days = [...goal.days].sort((a, b) => a - b).map(day => weekdayCodes[day])
  const description = [options.reason ? `Why: ${options.reason}` : '', 'One review counts as a practice day.', options.url]
    .filter(Boolean)
    .join('\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Code Reps//Practice plan//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:code-reps-practice-${utcStamp(now)}@code-reps.local`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(start)}`,
    `DURATION:PT${goal.minutes}M`,
    `RRULE:FREQ=WEEKLY;BYDAY=${days.join(',')}`,
    `SUMMARY:${icsText('Code Reps practice')}`,
    `DESCRIPTION:${icsText(description)}`,
    `URL:${options.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText('Code Reps practice')}`,
    'TRIGGER:-PT10M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}
