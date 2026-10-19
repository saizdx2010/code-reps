import { useEffect } from 'react'
import { InfoNote } from './Layout'
import { Button } from './Button'
import {
  browserProjects,
  externalSetup,
  projectHeading,
  projectReflection,
  projectReview,
  serviceProjectSetup,
  serviceProjects,
} from './browser-projects'
import type { BrowserProject } from './browser-projects'
import { repIndex as reps } from './catalog-index'
import { openProjectKey } from './ui-navigation'

type Props = { openRep: (id: string) => void; recordReflection: (title: string, body: string, skillId?: string) => void }

export function BrowserProjects({ openRep, recordReflection }: Props) {
  // A trail link names one project: open it and bring it into view once, then forget the request. The request is
  // cleared inside the frame, so a cancelled first run (React Strict Mode) leaves it for the run that follows.
  useEffect(() => {
    let projectId: string | null = null
    try {
      projectId = sessionStorage.getItem(openProjectKey)
    } catch {
      return
    }
    if (!projectId) return
    const frame = requestAnimationFrame(() => {
      try {
        sessionStorage.removeItem(openProjectKey)
      } catch {
        /* The request was read; a failed removal only means the project opens again on a later visit this session. */
      }
      const element = document.getElementById(`project-${projectId}`)
      if (element?.tagName !== 'DETAILS') return
      const details = element as HTMLDetailsElement
      details.open = true
      details.scrollIntoView({ block: 'start' })
      details.querySelector<HTMLElement>(':scope > summary')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  function reflect(project: BrowserProject) {
    recordReflection(projectHeading(project), projectReflection(project), project.skillId)
  }
  // Every project, browser level or DevOps, shares one layout: requirements, preparation, a self-review note, and a transfer.
  const overview = (project: BrowserProject) => (
    <details key={project.id} id={`project-${project.id}`} className="hub-panel project-overview">
      <summary>
        <h3>{projectHeading(project)}</h3>
        <p>{project.brief}</p>
        <span>External project · Self-review</span>
      </summary>
      <p>{project.readiness}</p>
      <details className="project-review">
        <summary>Preparation reps</summary>
        <div className="rep-links">
          {project.preparation.map(id => (
            <Button key={id} variant="text" onClick={() => openRep(id)}>
              {reps.find(rep => rep.id === id)?.title}
            </Button>
          ))}
        </div>
        <p>Preparation checks cover those reps, not your external application.</p>
      </details>
      <section>
        <h4>Detailed requirements</h4>
        <ol>
          {project.requirements.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ol>
      </section>
      <section>
        <h4>Examples and boundaries</h4>
        <ul>
          {project.examples.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
      <section>
        <h4>Tests and debugging</h4>
        <ul>
          {project.verification.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>
      <details className="project-review">
        <summary>Final self-review</summary>
        <ul>
          {(project.review ?? projectReview).map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p>Create a notebook entry with the requirement checklist. Record Met, Not met, or Not checked and the evidence for each item.</p>
        <Button onClick={() => reflect(project)}>Create {project.label ? project.label : `level ${project.level}`} self-review note</Button>
      </details>
      <details className="project-review">
        <summary>Later transfer challenge</summary>
        <p>{project.transfer}</p>
        <p>
          Attempt this after completing the original project. Keep hints and generated solutions out of independent attempts; documentation
          remains available.
        </p>
      </details>
    </details>
  )
  return (
    <>
      <section className="project-section" aria-labelledby="browser-project-heading">
        <h2 id="browser-project-heading">Build outside Code Reps</h2>
        <InfoNote>
          <p>
            Three levels for plain TypeScript and the DOM. Open any level; readiness guidance is optional. Each level includes a complete
            project with requirements and a self-review.
          </p>
          <p>
            Use documentation, choose your implementation, and write your own tests. You record and review your work here yourself.
            Independent and Retained skills need separate in-app reps.
          </p>
        </InfoNote>
        <details className="project-review">
          <summary>Set up your local project</summary>
          <ol>
            {externalSetup.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </details>
        {browserProjects.map(overview)}
      </section>
      <section className="project-section" aria-labelledby="service-project-heading">
        <h2 id="service-project-heading">Ship a service on your own machine</h2>
        <InfoNote>
          <p>
            The DevOps track ends here: containerize a service you wrote and add CI, using your own tools. Code Reps never builds, runs, or
            checks it.
          </p>
          <p>
            You run every command and record the results in a self-review note. That note is learner-reported evidence, kept apart from the
            checked reps and from Independent and Retained skills.
          </p>
        </InfoNote>
        <details className="project-review">
          <summary>Set up your local project</summary>
          <ol>
            {serviceProjectSetup.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </details>
        {serviceProjects.map(overview)}
      </section>
    </>
  )
}
