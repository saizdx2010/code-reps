import { createPortal } from 'react-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { profileBadges, unacknowledgedBadges } from './badges'
import type { Badge } from './badges'
import type { PortableRecord } from './portability'
import { useSessionPreference } from './useSessionPreference'

type Props = { history: PortableRecord[]; now: number; onView: () => void; portalTarget?: HTMLElement | null }

const noticeMs = 8000

function acknowledgedIds(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : null
  } catch { return null }
}

/**
 * A quiet status line when a milestone is reached. Acknowledged badge IDs are session UI state, scoped to the
 * profile, so a reload does not repeat them and backups never contain them. The notice never takes focus.
 * Without a session record, the badges earned when this view opens are the baseline, so reopening never celebrates them.
 */
export function BadgeNotice({ history, now, onView, portalTarget }: Props) {
  const badges = useMemo(() => profileBadges(history, new Date(now)), [history, now])
  const [acknowledged, setAcknowledged] = useSessionPreference<string>('badges-acknowledged', '')
  // Captured once per mount: badges earned after this view opens are new, even though they are earned by the next render.
  const [baseline] = useState(() => badges.filter(badge => badge.earned).map(badge => badge.id))
  const known = acknowledgedIds(acknowledged) ?? baseline
  const fresh = unacknowledgedBadges(badges, known)
  const freshKey = fresh.map(badge => badge.id).join(',')
  const noticeRef = useRef<HTMLDivElement | null>(null)
  // The badges this notice is announcing. They stay on screen for a while even though they are acknowledged at once.
  const [shown, setShown] = useState<Badge[]>([])
  // The effects read the latest acknowledgement without restarting every time the app re-renders.
  const latest = useRef({ known, fresh })
  useEffect(() => { latest.current = { known, fresh } })

  useEffect(() => {
    if (!freshKey) return
    // Acknowledge when the notice is shown, so remounting on the next rep never shows the same badge again.
    const { known: current, fresh: pending } = latest.current
    setAcknowledged(JSON.stringify([...current, ...pending.map(badge => badge.id)]))
    setShown(pending)
  }, [freshKey, setAcknowledged])

  // A notice raised in the completion panel belongs to that moment; leaving the panel for the next rep ends it.
  const inPanel = useRef(Boolean(portalTarget))
  useEffect(() => {
    if (inPanel.current && !portalTarget) setShown([])
    inPanel.current = Boolean(portalTarget)
  }, [portalTarget])

  useEffect(() => {
    if (shown.length === 0) return
    const timer = window.setTimeout(() => {
      // Keep the notice while the learner is working inside it.
      if (noticeRef.current?.contains(document.activeElement)) return
      setShown([])
    }, noticeMs)
    return () => window.clearTimeout(timer)
  }, [shown])

  if (shown.length === 0) return null
  const notice = <div ref={noticeRef} className={`badge-notice${portalTarget ? ' in-panel' : ' in-bar'}`} role="status">
    <p><strong>{shown.length === 1 ? 'Badge earned' : 'Badges earned'}:</strong> {shown.map(badge => badge.name).join(', ')}</p>
    <button type="button" className="text-button" onClick={() => { setShown([]); onView() }}>View badges</button>
  </div>
  return portalTarget ? createPortal(notice, portalTarget) : notice
}
