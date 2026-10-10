import { InfoNote } from './Layout'
import { Button } from './Button'
import { browserProjects, externalSetup, projectReflection, projectReview } from './browser-projects'
import type { BrowserProject } from './browser-projects'
import { reps } from './rep'

export function BrowserProjects({ openRep, recordReflection }: { openRep: (id: string) => void; recordReflection: (title: string, body: string) => void }) {
  function reflect(project: BrowserProject) {
    recordReflection(`Level ${project.level}: ${project.title}`, projectReflection(project))
  }
  return <section aria-labelledby="browser-project-heading">
    <h2 id="browser-project-heading">Build outside Code Reps</h2>
    <InfoNote><p>Three levels for plain TypeScript and the DOM. Open any level; readiness guidance is optional. Each level includes a complete project with requirements and a self-review.</p>
    <p>Use documentation, choose your implementation, and write your own tests. You record and review your work here yourself. Independent and Retained skills need separate in-app reps.</p></InfoNote>
    <details className="project-review"><summary>Set up your local project</summary><ol>{externalSetup.map(point => <li key={point}>{point}</li>)}</ol></details>
    {browserProjects.map(project => <details key={project.id} className="hub-panel project-overview">
      <summary><h3>Level {project.level}: {project.title}</h3><p>{project.brief}</p><span>External project · Self-review</span></summary>
      <p>{project.readiness}</p>
      <details className="project-review"><summary>Preparation reps</summary><div className="rep-links">{project.preparation.map(id => <Button key={id} variant="text" onClick={() => openRep(id)}>{reps.find(rep => rep.id === id)?.title}</Button>)}</div><p>Preparation checks cover those reps, not your external application.</p></details>
      <section><h4>Detailed requirements</h4><ol>{project.requirements.map(point => <li key={point}>{point}</li>)}</ol></section>
      <section><h4>Examples and boundaries</h4><ul>{project.examples.map(point => <li key={point}>{point}</li>)}</ul></section>
      <section><h4>Tests and debugging</h4><ul>{project.verification.map(point => <li key={point}>{point}</li>)}</ul></section>
      <details className="project-review"><summary>Final self-review</summary><ul>{projectReview.map(point => <li key={point}>{point}</li>)}</ul><p>Create a notebook entry with the requirement checklist. Record Met, Not met, or Not checked and the evidence for each item.</p><Button onClick={() => reflect(project)}>Create level {project.level} self-review note</Button></details>
      <details className="project-review"><summary>Later transfer challenge</summary><p>{project.transfer}</p><p>Attempt this after completing the original project. Keep hints and generated solutions out of independent attempts; documentation remains available.</p></details>
    </details>)}
  </section>
}
