import { Icon } from './Icon'
import { pathApplications, repCurriculumRole, repCurriculumEvidence } from './curriculum'
import type { JourneyProgress } from './learning'
import { Select } from './Input'
import { PathIntroduction } from './PathIntroduction'
import { paths } from './path'
import { reps } from './rep'
import type { Rep } from './rep'
import type { LearnerStart } from './learning'

type PathId = (typeof paths)[number]['id']
type Props = {
  goalPathId: string
  setGoalPath: (id: PathId) => void
  goalError: string
  progress: JourneyProgress[]
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

export function PathsPage({ goalPathId, setGoalPath, goalError, progress, pathId, setPathId, pathPicker, setPathPicker, learnerStart, completedPathIds, recallReady, repStatus, openRep }: Props) {
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
      <h1 tabIndex={-1}>Follow a learning path.</h1>
      <p>Build a skill through guided practice, independent work, and later recall.</p>
    </div>
    <label className="path-select">Choose path
      <Select value={selectedPath.id} onChange={event => setPathId(event.target.value as PathId)}>
        {paths.map(path => <option key={path.id} value={path.id}>{path.title}</option>)}
      </Select>
    </label>
    <section className="path-overview" aria-labelledby="path-title">
      <div>
        <h2 id="path-title" tabIndex={-1}>{learnerStart === 'returning' && selectedPath.id === 'typescript' ? 'Return to problem solving' : selectedPath.title}</h2>
        <p>{learnerStart === 'returning' && selectedPath.id === 'typescript' ? 'Start with guided problems, then revisit skills without hints after a break.' : selectedPath.description}</p>
        <span className="continue-status">{pathCompletedCount} of {pathRepIds.length} reps completed</span>
      </div>{nextPathRep && <button className="primary-button" type="button" onClick={() => pathCompletedCount === 0 ? document.getElementById('path-introduction')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }) : openRep(nextPathRep.id)}>{pathCompletedCount === 0 ? <>Read introduction<Icon name="down" /></> : 'Continue path'}</button>}</section>
    <p>Path completion records finished reps, including hinted work. Independence and retention use separate skill evidence.</p>
    <div className="path-goal"><p>{goalPathId === selectedPath.id ? 'Your current learning goal.' : 'Browsing this path does not change your learning goal.'}</p><button type="button" className="text-button" disabled={goalPathId === selectedPath.id} onClick={() => setGoalPath(selectedPath.id)}>Use this as my learning goal</button>{goalError && <p role="alert">{goalError}</p>}</div>
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
    <div className="path-stages">{pathStages.map((stage, stageIndex) => <details className="path-stage" key={stage.title} open={stage.repIds.some(id => id === nextPathRep?.id) || stageIndex === 0}>
        <summary className="path-stage-heading">
          <span>{String(stageIndex + 1).padStart(2, '0')}</span>
          <div>
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
          </div>
        </summary>
        <ol>{stage.repIds.map((id) => { const item = reps.find((entry) => entry.id === id); if (!item) return null; const done = completedPathIds.has(id); return <li key={id}>
            <button type="button" aria-current={id === nextPathRep?.id ? 'step' : undefined} onClick={() => openRep(id)}>
              <span>{item.title}<small className="path-role">{repCurriculumRole(id)}{id === nextPathRep?.id ? ' · Next in path' : ''}</small></span>
              <small>{done ? 'Completed' : repStatus(item)}{repCurriculumEvidence(id, progress) && <span className="path-evidence">{repCurriculumEvidence(id, progress)}</span>}</small>
            </button>
          </li> })}</ol>
      </details>)}</div>
    {pathApplications[selectedPath.id] && <section className="path-applications" aria-labelledby="path-application-title"><h2 id="path-application-title">Apply this path in a project</h2><p>These opportunities use the skills in a larger task. Completion alone does not establish transfer or mastery.</p>{pathApplications[selectedPath.id]!.map(application => <div key={application.repId}><h3>{reps.find(rep => rep.id === application.repId)!.title}</h3><p>{application.reason}</p><button className="text-button" type="button" onClick={() => openRep(application.repId)}>Open project milestone</button></div>)}</section>}
  </main>
}
