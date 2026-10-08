import { PageHeader } from './Layout'
import { learningPageTitles } from './learning-pages'
import type { HubTab } from './learning-pages'

function Lines() {
  return <><span className="skeleton-line skeleton-title" /><span className="skeleton-line" /><span className="skeleton-line skeleton-short" /></>
}

function Fields({ count = 2, stacked = false }: { count?: number; stacked?: boolean }) {
  return <div className={`loading-fields${stacked ? ' loading-fields-stacked' : ''}`}>{Array.from({ length: count }, (_, index) => <div key={index}><span className="skeleton-label" /><span className="skeleton-field" /></div>)}</div>
}

function Rows({ count = 3 }: { count?: number }) {
  return <div className="loading-rows">{Array.from({ length: count }, (_, index) => <div className="loading-row" key={index}><Lines /></div>)}</div>
}

function ProjectSkeleton() {
  return <div aria-hidden="true"><h2>Build outside Code Reps</h2><div className="loading-project-intro"><span className="skeleton-label" /></div><Rows /></div>
}

type PageLoadingProps = { page: HubTab; notebookHasDraft?: boolean; notebookHasEntries?: boolean }

/** Pending routes keep the loaded heading and first working surface in the same place. */
export function PageLoading({ page, notebookHasDraft = false, notebookHasEntries = false }: PageLoadingProps) {
  const copy = learningPageTitles[page]
  return <main className={`learning-hub page-loading loading-${page}`} aria-busy="true">
    <PageHeader title={copy.title} description={copy.description} />
    <p className="loading-status page-loading-status" role="status">{({ knowledge: 'Opening lesson…', notebook: 'Opening notebook…', plan: 'Preparing practice week…', assessment: 'Preparing self-assessment…', projects: 'Opening projects…', interview: 'Preparing interview practice…' })[page]}</p>
    <div aria-hidden="true">
      {page === 'knowledge' ? <div className="loading-lesson-layout"><aside><span className="skeleton-label" /><Fields stacked /><Rows /></aside><div className="knowledge-article loading-sheet"><div className="loading-lesson-heading"><div><Lines /></div><span className="skeleton-action" /></div><div className="loading-tabs">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div><Rows /><div className="skeleton-code" /></div></div>
        : page === 'notebook' ? <div className="loading-notebook-surface"><div className="hub-heading loading-notebook-heading"><div><span className="skeleton-line" /><span className="skeleton-line skeleton-short" /></div><span className="skeleton-action" /></div><Fields count={1} />{notebookHasDraft ? <div className="hub-panel loading-sheet"><Lines /><Fields count={1} /><Fields count={3} /><div className="skeleton-writing" /><span className="skeleton-action" /></div> : notebookHasEntries ? <div className="hub-cards">{[0, 1].map(index => <div className="hub-panel loading-sheet" key={index}><Lines /></div>)}</div> : <div className="hub-empty loading-notebook-empty"><Lines /><span className="skeleton-action" /></div>}</div>
          : page === 'plan' ? <div className="hub-panel loading-sheet"><Lines /><Fields /><span className="skeleton-label" /><div className="loading-week">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div><Rows /></div>
            : page === 'assessment' ? <><div className="hub-panel loading-sheet"><Lines /><span className="skeleton-action" /></div><Rows count={3} /></>
              : page === 'projects' ? <ProjectSkeleton />
                : <div className="hub-panel loading-sheet loading-interview-sheet"><Lines /><Fields stacked /><span className="skeleton-action" /></div>}
    </div>
  </main>
}

export function ProjectListLoading() {
  return <section className="project-list-loading" aria-busy="true"><p className="loading-status page-loading-status" role="status">Opening project requirements…</p><ProjectSkeleton /></section>
}

export function EditorLoading() {
  return <div className="editor-loading" aria-busy="true"><p className="loading-status" role="status">Opening editor · your saved code stays here</p><div className="loading-code-lines" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div className="loading-code-row" key={index}><span className="skeleton-gutter" /><span className="skeleton-line" /></div>)}</div></div>
}

export function PreviewLoading() {
  return <section className="panel frontend-preview preview-loading" aria-busy="true"><div className="panel-heading"><h2>Interactive preview</h2></div><p className="loading-status page-loading-status" role="status">Opening preview controls…</p><div aria-hidden="true"><div className="loading-preview-description"><span className="skeleton-line" /><span className="skeleton-line skeleton-short" /></div><div className="preview-controls loading-preview-controls"><span className="skeleton-field" /><span className="skeleton-field" /><span className="skeleton-action" /><span className="skeleton-action" /></div><div className="preview-empty loading-preview-empty"><span className="skeleton-line" /></div><div className="loading-preview-review"><span className="skeleton-label" /></div></div></section>
}
