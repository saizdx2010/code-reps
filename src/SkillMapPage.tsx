import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Select } from './Input'
import { EmptyState, InfoNote, PageHeader, StatusChip } from './Layout'
import { preloadEditor } from './editor-loader'
import { paths } from './path'
import { repTitle } from './rep-index.ts'
import { buildSkillMap, parseStepKeys, skillStateLabels, skillStateMeaning, skillStepKey } from './skill-map'
import { useSessionPreference } from './useSessionPreference'
import type { SkillNode, SkillState } from './skill-map'
import type { JourneyProgress } from './learning'
import type { ChipTone } from './ui-status'
import { formatDate } from './ui-copy'
import { SkillsSwitch } from './ProgressPage'

type Props = {
  goalPathId: string
  progress: JourneyProgress[]
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

function detail(node: SkillNode) {
  if (node.state === 'independent') {
    return node.recallAt ? `Fresh recall ready ${formatDate(node.recallAt)}.` : 'Fresh recall comes after a break.'
  }
  if (node.state === 'retained') return 'Fresh recall is recorded.'
  return node.repId ? `Next: ${repTitle(node.repId)}.` : ''
}

/** Each skill of the chosen track drawn on the trail as one node with its recorded evidence state. */
export function SkillMapPage({ goalPathId, progress, openRep, reviewRep }: Props) {
  const [pathId, setPathId] = useState(goalPathId)
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  const map = useMemo(() => buildSkillMap(path.id, progress), [path.id, progress])
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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const frame = requestAnimationFrame(() => nodes[0].scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' }))
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
        eyebrow="Skills"
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
        <ol ref={trail} className="trail skill-trail" aria-label={`${path.title} skills`}>
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
                      className={`trail-node skill-node is-skill-${node.state}`}
                      data-stepped={replay.has(skillStepKey(node.id, node.state)) || undefined}
                    >
                      <span className="trail-marker" aria-hidden="true">
                        <Icon name={markers[node.state]} />
                      </span>
                      <div className="skill-node-body">
                        <span className="trail-node-title">{node.title}</span>
                        <StatusChip tone={tones[node.state]}>{skillStateLabels[node.state]}</StatusChip>
                        {detail(node) && <small>{detail(node)}</small>}
                        {node.repId && (
                          <button
                            type="button"
                            className="text-button"
                            onMouseEnter={preloadEditor}
                            onFocus={preloadEditor}
                            aria-label={`${node.actionLabel}: ${repTitle(node.repId)} (${node.title})`}
                            onClick={() => (node.mode === 'review' ? reviewRep(node.repId!) : openRep(node.repId!))}
                          >
                            {node.actionLabel}
                            <Icon name="arrow" />
                          </button>
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
