import { formatDate, plural } from './ui-copy.ts'
import { Button } from './Button'
import { ProjectListLoading } from './LoadingStates'
import { lazy, Suspense } from 'react'
import { capstones } from './fluency'
import type { FluencyState, LearningNote } from './fluency'
import type { PortableRecord } from './portability'

const BrowserProjects = lazy(() => import('./BrowserProjects')
  .then(module => ({ default: module.BrowserProjects }))
  .catch(() => ({ default: () => <section role="alert">
    <p>Browser projects could not load. Reload to try again; your saved work will be kept.</p>
    <Button onClick={() => window.location.reload()}>Reload projects</Button>
  </section> })))

type Props = {
  state: FluencyState
  update: (next: FluencyState) => boolean
  history: PortableRecord[]
  openRep: (id: string) => void
  openNotebook: () => void
}

/** Projects: the in-browser projects, then capstones as milestones with a final self-review. */
export function LearningProjects({ state, update, history, openRep, openNotebook }: Props) {
  function recordReflection(title: string, body: string) {
    const note: LearningNote = { id: crypto.randomUUID(), title, body, skillId: 'frontend', repId: '', kind: 'note', updatedAt: new Date().toISOString() }
    if (update({ ...state, notes: [note, ...state.notes] })) openNotebook()
  }
  return <>
    <Suspense fallback={<ProjectListLoading />}><BrowserProjects openRep={openRep} recordReflection={recordReflection} /></Suspense>
    <h2>Projects you can build here</h2>
    {capstones.map(project => <details key={project.id} className="hub-panel project-overview">
      <summary><h2>{project.title}</h2><p>{project.brief}</p><span>{project.milestones.length} milestones</span></summary>
      <ol className="milestone-list">{project.milestones.map(m => {
        const completed = history.find(a => a.repId === m.repId)
        return <li key={m.repId}>
          <div>
            <strong>{m.title}</strong>
            <p>{completed
              ? `Completed ${formatDate(completed.completedAt)} with ${completed.hintCount} ${plural(completed.hintCount, 'hint')}.`
              : 'Not completed yet.'}</p>
          </div>
          <Button variant="text" type="button" onClick={() => openRep(m.repId)}>Open milestone</Button>
        </li>
      })}</ol>
      <details className="project-review">
        <summary>Final self-review</summary>
        <ul>{project.review.map(point => <li key={point}>{point}</li>)}</ul>
        <Button variant="text" type="button" onClick={openNotebook}>Record a project reflection</Button>
      </details>
    </details>)}
  </>
}
