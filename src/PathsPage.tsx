import { Icon } from './Icon'
import { foundationsPathId, trackGroups } from './curriculum'
import { Select } from './Input'
import { InfoNote, PageHeader } from './Layout'
import { PathIntroduction } from './PathIntroduction'
import { Trail } from './Trail'
import type { buildTrail } from './trail-map'
import { paths } from './path'
import type { LearnerStart } from './learning'

type PathId = (typeof paths)[number]['id']
type Props = {
  goalPathId: string
  setGoalPath: (id: PathId) => void
  goalError: string
  pathId: PathId
  setPathId: (id: PathId) => void
  pathPicker: 'open' | 'closed'
  setPathPicker: (value: 'open' | 'closed') => void
  learnerStart: LearnerStart | null
  completedPathIds: Set<string>
  trail: ReturnType<typeof buildTrail>
  evidence: (repId: string) => string
  openRep: (id: string) => void
  openLesson: (skillId: string) => void
}

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** All tracks: Foundations first, then the tracks that build on it, and the selected track's trail. */
export function PathsPage({ goalPathId, setGoalPath, goalError, pathId, setPathId, pathPicker, setPathPicker, learnerStart, completedPathIds, trail, evidence, openRep, openLesson }: Props) {
  const selectedPath = paths.find((path) => path.id === pathId) ?? paths[0]
  const refresher = learnerStart === 'returning' && selectedPath.id === foundationsPathId
  const pathIntroduction = refresher
    ? { ...selectedPath.introduction, title: 'A quick TypeScript refresher', next: 'You can revisit the language basics above whenever you need them. Start with a guided array rep, then solve a related task on your own.' }
    : selectedPath.introduction
  const firstRepId = trail.stages.flatMap(stage => stage.nodes).find(node => node.kind === 'rep')?.id.slice(4)
  const count = (id: string) => { const ids = [...new Set(paths.find(path => path.id === id)!.stages.flatMap(stage => stage.repIds))]; return `${ids.filter(item => completedPathIds.has(item)).length} of ${ids.length} reps completed` }
  function choose(id: PathId) {
    setPathId(id)
    if (matchMedia('(max-width: 900px)').matches) setPathPicker('closed')
    requestAnimationFrame(() => { const heading = document.getElementById('path-title'); heading?.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'instant' : 'smooth' }); heading?.focus({ preventScroll: true }) })
  }
  const choice = (id: PathId, wide = false) => { const path = paths.find(item => item.id === id)!; return <button key={id} type="button" className={wide ? 'track-root' : undefined} aria-pressed={pathId === id} onClick={() => choose(id)}>
    <strong>{path.title}</strong>
    <span>{path.description}</span>
    <small>{count(id)}{goalPathId === id ? ' · Your goal' : ''}</small>
  </button> }
  return <main className="paths-main">
    <PageHeader title="Choose a track." description="Every track builds on Foundations. Follow one as your goal or browse any of them freely." actions={<label className="path-select">Choose path
      <Select value={selectedPath.id} onChange={event => setPathId(event.target.value as PathId)}>
        {paths.map(path => <option key={path.id} value={path.id}>{path.title}</option>)}
      </Select>
    </label>} />
    <details className="path-picker" open={pathPicker === 'open'} onToggle={event => setPathPicker(event.currentTarget.open ? 'open' : 'closed')}>
      <summary>Explore paths <span>{paths.length} available</span></summary>
      <div className="track-map" role="group" aria-label="Learning paths">
        <div className="path-choices track-foundations"><span className="home-label">Start here</span>{choice(foundationsPathId, true)}</div>
        {trackGroups.map(group => <div key={group.title} className="track-group"><span className="home-label">{group.title}</span><div className="path-choices">{group.pathIds.map(id => choice(id))}</div></div>)}
      </div>
    </details>
    <section className="path-overview" aria-labelledby="path-title">
      <div>
        <span className="home-label">{selectedPath.id === foundationsPathId ? 'Foundations' : 'Builds on Foundations'}</span>
        <h2 id="path-title" tabIndex={-1}>{refresher ? 'Return to problem solving' : selectedPath.title}</h2>
        <p>{refresher ? 'Start with guided problems, then revisit skills without hints after a break.' : selectedPath.description}</p>
        <div className="path-goal"><p>{goalPathId === selectedPath.id ? 'Your current learning goal.' : 'Browsing this path does not change your learning goal.'}</p><button type="button" className="text-button" disabled={goalPathId === selectedPath.id} onClick={() => setGoalPath(selectedPath.id)}>Use this as my learning goal</button>{goalError && <p role="alert">{goalError}</p>}</div>
      </div>
      <div className="path-overview-action">
        <span className="continue-status">{trail.done} of {trail.total} reps completed</span>
        {trail.nextRepId && <button className="primary-button" type="button" onClick={() => openRep(trail.nextRepId!)}>{trail.done === 0 ? 'Start path' : 'Continue path'}<Icon name="arrow" /></button>}
      </div>
    </section>
    <div className="path-progress" role="progressbar" aria-label="Path progress" aria-valuenow={trail.done} aria-valuemin={0} aria-valuemax={trail.total}>
      <span style={{ width: `${trail.total ? trail.done / trail.total * 100 : 0}%` }} />
    </div>
    <InfoNote><p>Path completion records finished reps, including hinted work. Independence and retention use separate skill evidence: a guided rep, a related rep without hints, then a fresh recall after a break.</p></InfoNote>
    <details className="path-intro-details" open={trail.done === 0 && selectedPath.id === foundationsPathId}><summary>Introduction: {pathIntroduction.title}</summary><PathIntroduction introduction={pathIntroduction} onStart={() => firstRepId && openRep(firstRepId)} /></details>
    <Trail stages={trail.stages} evidence={evidence} onOpenRep={openRep} onOpenLesson={openLesson} onOpenFoundations={selectedPath.id === foundationsPathId ? undefined : () => choose(foundationsPathId)} />
  </main>
}
