import { PathIntroduction } from './PathIntroduction'
import { paths } from './path'
import { reps } from './rep'
import type { Rep } from './rep'
import type { LearnerStart } from './learning'

type PathId = (typeof paths)[number]['id']
type Props = {
  pathId: PathId
  setPathId: (id: PathId) => void
  pathPicker: 'open' | 'closed'
  setPathPicker: (value: 'open' | 'closed') => void
  learnerStart: LearnerStart | null
  completedPathIds: Set<string>
  recallReady: (id: string) => boolean
  repStatus: (rep: Rep) => string
  openRep: (id: string) => void
}

export function PathsPage({ pathId, setPathId, pathPicker, setPathPicker, learnerStart, completedPathIds, recallReady, repStatus, openRep }: Props) {
  const selectedPath = paths.find((path) => path.id === pathId) ?? paths[0]
  const pathStages = learnerStart === 'returning' && selectedPath.id === 'typescript' ? selectedPath.stages.slice(1) : selectedPath.stages
  const pathIntroduction = learnerStart === 'returning' && selectedPath.id === 'typescript'
    ? { ...selectedPath.introduction, title: 'A quick TypeScript refresher', next: 'You can revisit the language basics above whenever you need them. Start with a guided array rep, then solve a related task on your own.' }
    : selectedPath.introduction
  const pathRepIds = pathStages.flatMap((stage) => stage.repIds)
  const nextPathRep = reps.find((item) => item.id === pathRepIds.find((id) => !completedPathIds.has(id) && recallReady(id)))
  const pathCompletedCount = pathRepIds.filter((id) => completedPathIds.has(id)).length
  return <main className="paths-main">
    <div className="home-heading">
      <h1 tabIndex={-1}>Choose a learning path.</h1>
      <p>Free lessons and practice for coding in an AI-rich world. Open any path or rep.</p>
    </div>
    <section className="path-overview" aria-labelledby="path-title">
      <div>
        <span className="home-label">START HERE</span>
        <h2 id="path-title" tabIndex={-1}>{learnerStart === 'returning' && selectedPath.id === 'typescript' ? 'Return to problem solving' : selectedPath.title}</h2>
        <p>{learnerStart === 'returning' && selectedPath.id === 'typescript' ? 'Start with guided problems, then revisit skills without hints after a break.' : selectedPath.description}</p>
        <span className="continue-status">{pathCompletedCount} of {pathRepIds.length} reps completed</span>
      </div>{nextPathRep && <button className="primary-button" type="button" onClick={() => pathCompletedCount === 0 ? document.getElementById('path-introduction')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) : openRep(nextPathRep.id)}>{pathCompletedCount === 0 ? 'Read introduction ↓' : 'Continue path →'}</button>}</section>
    <details className="path-picker" open={pathPicker === 'open'} onToggle={event => setPathPicker(event.currentTarget.open ? 'open' : 'closed')}>
      <summary>Explore paths <span>{paths.length} available</span>
      </summary>
      <div className="path-choices" role="group" aria-label="Learning paths">{paths.map((path) => <button key={path.id} type="button" aria-pressed={pathId === path.id} onClick={() => { setPathId(path.id); if (matchMedia('(max-width: 900px)').matches) setPathPicker('closed'); requestAnimationFrame(() => { const heading = document.getElementById('path-title'); heading?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); heading?.focus({ preventScroll: true }) }) }}>
          <strong>{path.title}</strong>
          <span>{path.description}</span>
          <small>{path.stages.flatMap(stage => stage.repIds).filter(id => completedPathIds.has(id)).length} of {path.stages.flatMap(stage => stage.repIds).length} reps completed</small>
        </button>)}</div>
    </details>
    <PathIntroduction introduction={pathIntroduction} onStart={() => openRep(pathRepIds[0])} />
    <div className="path-progress" role="progressbar" aria-label="Path progress" aria-valuenow={pathCompletedCount} aria-valuemin={0} aria-valuemax={pathRepIds.length}>
      <span style={{ width: `${pathCompletedCount / pathRepIds.length * 100}%` }} />
    </div>
    <div className="path-stages">{pathStages.map((stage, stageIndex) => <details className="path-stage" key={stage.title} open={stageIndex === 0}>
        <summary className="path-stage-heading">
          <span>{String(stageIndex + 1).padStart(2, '0')}</span>
          <div>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </div>
        </summary>
        <ol>{stage.repIds.map((id) => { const item = reps.find((entry) => entry.id === id); if (!item) return null; const done = completedPathIds.has(id); return <li key={id}>
            <button type="button" disabled={!recallReady(id)} onClick={() => openRep(id)}>
              <span>{item.title}</span>
              <small>{!recallReady(id) ? 'Available after independent practice' : done ? 'Completed' : repStatus(item)}</small>
              <span aria-hidden="true">→</span>
            </button>
          </li> })}</ol>
      </details>)}</div>
  </main>
}
