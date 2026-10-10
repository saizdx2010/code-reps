import { useMemo, useState } from 'react'
import { Icon } from './Icon'
import { Select } from './Input'
import { EmptyState, InfoNote, PageHeader, StatusChip } from './Layout'
import { preloadEditor } from './editor-loader'
import { paths } from './path'
import { repIndex as reps } from './catalog-index'
import { buildSkillMap, skillStateLabels, skillStateMeaning } from './skill-map'
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

const tones: Record<SkillState, ChipTone> = { untouched: 'neutral', practiced: 'progress', independent: 'progress', retained: 'success', due: 'attention' }
const markers = { untouched: 'circle', practiced: 'code', independent: 'check', retained: 'flag', due: 'repeat' } as const
const order: SkillState[] = ['untouched', 'practiced', 'independent', 'retained', 'due']
const repTitle = (id: string) => reps.find(rep => rep.id === id)?.title ?? id

function detail(node: SkillNode) {
  if (node.state === 'independent') return node.recallAt ? `Fresh recall ready ${formatDate(node.recallAt)}.` : 'Fresh recall comes after a break.'
  if (node.state === 'retained') return 'Fresh recall is recorded.'
  return node.repId ? `Next: ${repTitle(node.repId)}.` : ''
}

/** Each skill of the chosen track drawn on the trail as one node with its recorded evidence state. */
export function SkillMapPage({ goalPathId, progress, openRep, reviewRep }: Props) {
  const [pathId, setPathId] = useState(goalPathId)
  const path = paths.find(item => item.id === pathId) ?? paths[0]
  const map = useMemo(() => buildSkillMap(path.id, progress), [path.id, progress])
  return <main className="skill-map-main">
    <PageHeader eyebrow="Skills" title="Skill map." description="Every skill in a track, shown by the practice evidence recorded so far." actions={<><SkillsSwitch view="skillmap" /><label className="path-select">Track
      <Select value={path.id} onChange={event => setPathId(event.target.value)}>
        {paths.map(item => <option key={item.id} value={item.id}>{item.title}{item.id === goalPathId ? ' (your goal)' : ''}</option>)}
      </Select>
    </label></>} />
    <InfoNote label="What this map shows"><p>Each state describes recorded practice evidence, not mastery. Practiced means a guided rep is completed, even with hints. Independent means a related rep was solved without hints. Retained means a fresh recall rep was solved without hints after a break. Checks show tested behavior, and you review your own writing.</p></InfoNote>
    <section className="skill-legend" aria-labelledby="skill-legend-title">
      <h2 id="skill-legend-title">Legend</h2>
      <ul>{order.map(state => <li key={state}><StatusChip tone={tones[state]}>{skillStateLabels[state]}</StatusChip><span>{skillStateMeaning[state]}</span><b>{map.counts[state]}</b></li>)}</ul>
    </section>
    {map.total === 0 ? <EmptyState title="No tracked skills in this track yet.">Choose another track to see its skills.</EmptyState> : <ol className="trail skill-trail" aria-label={`${path.title} skills`}>
      {map.stages.map((stage, index) => <li key={stage.title} className="trail-stage">
        <details className="path-stage" open>
          <summary className="path-stage-heading">
            <span className="trail-stage-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <div><h2>{stage.title}</h2></div>
            <span className="trail-stage-count">{stage.nodes.filter(node => node.state === 'independent' || node.state === 'retained').length}/{stage.nodes.length}</span>
          </summary>
          <ol className="trail-nodes">{stage.nodes.map(node => <li key={node.id} className={`trail-node skill-node is-skill-${node.state}`}>
            <span className="trail-marker" aria-hidden="true"><Icon name={markers[node.state]} /></span>
            <div className="skill-node-body">
              <span className="trail-node-title">{node.title}</span>
              <StatusChip tone={tones[node.state]}>{skillStateLabels[node.state]}</StatusChip>
              {detail(node) && <small>{detail(node)}</small>}
              {node.repId && <button type="button" className="text-button" onMouseEnter={preloadEditor} onFocus={preloadEditor} aria-label={`${node.actionLabel}: ${repTitle(node.repId)} (${node.title})`} onClick={() => node.mode === 'review' ? reviewRep(node.repId!) : openRep(node.repId!)}>{node.actionLabel}<Icon name="arrow" /></button>}
            </div>
          </li>)}</ol>
        </details>
      </li>)}
    </ol>}
  </main>
}
