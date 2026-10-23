import { reducedMotion } from './ui-motion'
import { Button } from './Button'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Select } from './Input'
import { EmptyState, InfoNote, PageHeader, StatusChip } from './Layout'
import { preloadPractice } from './editor-loader'
import { paths } from './path'
import { repTitle } from './rep-index.ts'
import { buildSkillMap, parseStepKeys, skillStateLabels, skillStateMeaning, skillStepKey } from './skill-map'
import { useSessionPreference } from './useSessionPreference'
import type { SkillNode, SkillState } from './skill-map'
import type { JourneyProgress } from './learning'
import type { ChipTone } from './ui-status'
import { formatDate } from './ui-copy'
import { SkillsSwitch } from './ProgressPage'
import type { PortableRecord } from './portability'
import { fadingSkills, mapWeeks, progressAt, skillThenAndNow } from './skill-growth'
import type { ThenAndNow } from './skill-growth'
import { plural } from './ui-copy'
import './skill-growth.css'

type Props = {
  goalPathId: string
  progress: JourneyProgress[]
  history: PortableRecord[]
  openRep: (id: string) => void
  reviewRep: (id: string) => void
}

const tones: Record<SkillState, ChipTone> = {
  untouched: 'neutral',
  practiced: 'progress',
  independent: 'progress',
  retained: 'success',
  due: 'attention',
}
const markers = { untouched: 'circle', practiced: 'code', independent: 'check', retained: 'flag', due: 'repeat' } as const
const order: SkillState[] = ['untouched', 'practiced', 'independent', 'retained', 'due']

const daysUntil = (iso: string) => Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000))
function detail(node: SkillNode) {
  if (node.state === 'independent') {
    if (!node.recallAt) return 'Fresh recall comes after a break.'
    const days = daysUntil(node.recallAt)
    return `Fresh recall opens ${days === 1 ? 'tomorrow' : `in ${days} days`} (${formatDate(node.recallAt)}).`
  }
  if (node.state === 'retained') return 'Fresh recall is recorded.'
  return node.repId ? `Next: ${repTitle(node.repId)}.` : ''
}

/** Each skill of the chosen track drawn on the trail as one node with its recorded evidence state. */
export function SkillMapPage({ goalPathId, progress, history, openRep, reviewRep }: Props) {
  const [pathId, setPathId] = useState(goalPathId)
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  // The map over time: each week's end, from the first attempt to now. The last position is today.
  const weeks = useMemo(() => mapWeeks(history), [history])
  const [week, setWeek] = useState<number | null>(null)
  const at = week ?? weeks.length - 1
  const scrubbing = week !== null && week < weeks.length - 1
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setWeek(current => {
        const next = (current ?? 0) + 1
        if (next >= weeks.length - 1) setPlaying(false)
        return Math.min(next, weeks.length - 1)
      })
    }, 700)
    return () => clearInterval(id)
  }, [playing, weeks.length])
  const shown = useMemo(() => (scrubbing ? progressAt(history, weeks[at]) : progress), [scrubbing, history, weeks, at, progress])
  const map = useMemo(() => buildSkillMap(path.id, shown), [path.id, shown])
  const fading = useMemo(() => fadingSkills(history), [history])
  const journeys = useMemo(() => new Map(progress.map(item => [item.journey.id, item])), [progress])
  const replay = useStepReplay()
  const stepped = map.stages.flatMap(stage => stage.nodes).filter(node => replay.has(skillStepKey(node.id, node.state)))
  const trail = useRef<HTMLOListElement>(null)
  const steppedKey = stepped.map(node => node.id).join(',')
  // Announced when the step plays: a live region only speaks when its text changes after it is shown.
  const [announcement, setAnnouncement] = useState('')
  const announce = stepped
    .map(node => `${node.title} moved up to ${skillStateLabels[node.state === 'due' ? 'independent' : node.state]}.`)
    .join(' ')
  const latestAnnouncement = useRef(announce)
  useEffect(() => {
    latestAnnouncement.current = announce
  })
  // Bring the first stepped skill into view, then play each step once, when its node is actually on screen.
  useEffect(() => {
    const nodes = Array.from(trail.current?.querySelectorAll<HTMLElement>('[data-stepped]') ?? [])
    if (nodes.length === 0) return
    const frame = requestAnimationFrame(() =>
      nodes[0].scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'instant' : 'smooth' }),
    )
    const play = (node: HTMLElement) => {
      node.dataset.step = 'play'
      setAnnouncement(latestAnnouncement.current)
    }
    if (typeof IntersectionObserver === 'undefined') nodes.forEach(play)
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver(
            entries => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue
                play(entry.target as HTMLElement)
                observer?.unobserve(entry.target)
              }
            },
            { threshold: 0.9 },
          )
    nodes.forEach(node => observer?.observe(node))
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [steppedKey])
  return (
    <main className="skill-map-main">
      <PageHeader
        title="Skill map"
        description="Every skill in a track, shown by the practice evidence recorded so far."
        actions={<SkillsSwitch view="skillmap" />}
      />
      <div className="skill-map-tools">
        <label className="path-select">
          Track
          <Select value={path.id} onChange={event => setPathId(event.target.value)}>
            {paths.map(item => (
              <option key={item.id} value={item.id}>
                {item.title}
                {item.id === goalPathId ? ' (your goal)' : ''}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <InfoNote label="What this map shows">
        <p>
          Each state describes recorded practice evidence, not mastery. Guided means a guided rep is completed, even with hints. Independent
          means a related rep was solved without hints. Retained means a fresh recall rep was solved without hints after a break. Checks
          show tested behavior, and you review your own writing.
        </p>
      </InfoNote>
      {weeks.length > 2 && (
        <section className="skill-timeline" aria-labelledby="skill-timeline-title">
          <h2 id="skill-timeline-title">Your map over time</h2>
          <div className="skill-timeline-controls">
            <Button
              onClick={() => {
                if (playing) return setPlaying(false)
                if (!scrubbing) setWeek(0)
                setPlaying(true)
              }}
            >
              {!playing && <Icon name="play" />}
              {playing ? 'Pause' : scrubbing ? 'Play on' : 'Replay your weeks'}
            </Button>
            <input
              type="range"
              min={0}
              max={weeks.length - 1}
              value={at}
              aria-label="Week shown"
              aria-valuetext={weekLabel(weeks, at)}
              onChange={event => {
                setPlaying(false)
                setWeek(Number(event.target.value))
              }}
            />
            <output aria-live="polite">{weekLabel(weeks, at)}</output>
          </div>
          {scrubbing && (
            <p className="skill-timeline-note">
              Showing the evidence recorded by then.{' '}
              <Button
                variant="text"
                onClick={() => {
                  setPlaying(false)
                  setWeek(null)
                }}
              >
                Back to today
              </Button>
            </p>
          )}
        </section>
      )}
      <section className="skill-legend" aria-labelledby="skill-legend-title">
        <h2 id="skill-legend-title">Legend</h2>
        <ul>
          {order.map(state => (
            <li key={state}>
              <StatusChip tone={tones[state]}>{skillStateLabels[state]}</StatusChip>
              <span>{skillStateMeaning[state]}</span>
              <b>{map.counts[state]}</b>
            </li>
          ))}
        </ul>
      </section>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
      {map.total === 0 ? (
        <EmptyState title="No tracked skills in this track yet.">Choose another track to see its skills.</EmptyState>
      ) : (
        <ol ref={trail} className={`trail skill-trail${scrubbing || playing ? ' is-scrubbing' : ''}`} aria-label={`${path.title} skills`}>
          {map.stages.map((stage, index) => (
            <li key={stage.title} className="trail-stage">
              <details className="path-stage" open>
                <summary className="path-stage-heading">
                  <span className="trail-stage-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h2>{stage.title}</h2>
                  </div>
                  <span className="trail-stage-count">
                    {/* A due review is still independent evidence, so waiting for recall never lowers the count. */}
                    {stage.nodes.filter(node => ['independent', 'due', 'retained'].includes(node.state)).length}/{stage.nodes.length}
                  </span>
                </summary>
                <ol className="trail-nodes">
                  {stage.nodes.map(node => (
                    <li
                      key={node.id}
                      className={`trail-node skill-node is-skill-${node.state}${!scrubbing && fading.has(node.id) ? ' is-fading' : ''}`}
                      data-stepped={replay.has(skillStepKey(node.id, node.state)) || undefined}
                    >
                      {/* Keyed by state, so a change while replaying the weeks pops the marker in again. */}
                      <span key={node.state} className="trail-marker" aria-hidden="true">
                        <Icon name={markers[node.state]} />
                      </span>
                      <div className="skill-node-body">
                        <span className="trail-node-title">{node.title}</span>
                        <StatusChip tone={tones[node.state]}>{skillStateLabels[node.state]}</StatusChip>
                        {!scrubbing && fading.has(node.id) ? (
                          <Fading fading={fading.get(node.id)!} title={node.title} onReview={reviewRep} />
                        ) : (
                          detail(node) && <small>{detail(node)}</small>
                        )}
                        {!scrubbing && node.state === 'retained' && journeys.get(node.id) && (
                          <SkillThenAndNow growth={skillThenAndNow(journeys.get(node.id)!, history)} />
                        )}
                        {!scrubbing && node.repId && (
                          <Button
                            variant="text"
                            onMouseEnter={() => preloadPractice(node.repId!)}
                            onFocus={() => preloadPractice(node.repId!)}
                            aria-label={`${node.actionLabel}: ${repTitle(node.repId)} (${node.title})`}
                            onClick={() => (node.mode === 'review' ? reviewRep(node.repId!) : openRep(node.repId!))}
                          >
                            {node.actionLabel}
                            <Icon name="arrow" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </details>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}

/**
 * Steps queued when a rep was completed this session and not yet shown here. They are acknowledged as soon as the map
 * opens, so each step plays once; the queue is session UI state and never enters backups.
 */
function useStepReplay() {
  const [pending] = useSessionPreference<string>('skill-steps-pending', '[]')
  const [shown, setShown] = useSessionPreference<string>('skill-steps-shown', '[]')
  const [replay] = useState(() => {
    const seen = parseStepKeys(shown)
    return new Set(parseStepKeys(pending).filter(key => !seen.includes(key)))
  })
  useEffect(() => {
    const seen = parseStepKeys(shown)
    const fresh = [...replay].filter(key => !seen.includes(key))
    if (fresh.length) setShown(JSON.stringify([...seen, ...fresh]))
  }, [replay, shown, setShown])
  return replay
}

function weekLabel(weeks: number[], at: number) {
  if (at >= weeks.length - 1) return 'Today'
  const end = new Date(weeks[at])
  const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6)
  return `Week of ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

/** A retained skill not used for a while: still recorded, but its next spaced review is due. */
function Fading({
  fading,
  title,
  onReview,
}: {
  fading: { repId: string; heldDays: number }
  title: string
  onReview: (id: string) => void
}) {
  const days = fading.heldDays
  return (
    <>
      <small>
        Fading: last held {days} {plural(days, 'day')} ago. A fresh review keeps it.
      </small>
      <Button
        variant="text"
        onMouseEnter={() => preloadPractice(fading.repId)}
        onFocus={() => preloadPractice(fading.repId)}
        aria-label={`Fresh review: ${repTitle(fading.repId)} (${title})`}
        onClick={() => onReview(fading.repId)}
      >
        Fresh review
        <Icon name="arrow" />
      </Button>
    </>
  )
}

const excerpt = (text: string) => (text.trim().length > 160 ? `${text.trim().slice(0, 157)}…` : text.trim())
const hints = (count: number) => (count ? `${count} ${plural(count, 'hint')}` : 'No hints')

/** A retained skill's first guided attempt beside the recall that retained it, as saved. Never scored. */
function SkillThenAndNow({ growth }: { growth: ThenAndNow | null }) {
  if (!growth) return null
  const sides = [
    { label: 'Then', record: growth.first },
    { label: 'Now', record: growth.latest },
  ]
  return (
    <details className="skill-then-now">
      <summary>Then and now</summary>
      <p className="skill-then-now-gap">
        {growth.days} {plural(growth.days, 'day')} from your first guided rep to the recall that held.
      </p>
      <div className="skill-then-now-sides">
        {sides.map(({ label, record }) => (
          <section key={label} aria-label={label}>
            <h3>{label}</h3>
            <p className="skill-then-now-meta">
              {repTitle(record.repId)} · {formatDate(record.completedAt)} · {hints(record.hintCount)}
            </p>
            <p>{record.plan.trim() ? excerpt(record.plan) : <span className="skill-then-now-empty">No plan written.</span>}</p>
          </section>
        ))}
      </div>
    </details>
  )
}
