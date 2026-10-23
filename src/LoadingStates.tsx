import type { ReactNode } from 'react'
import { PageHeader } from './Layout'
import { learningPageBack, learningPageTitles } from './learning-pages'
import { goToView } from './ui-navigation'
import type { HubTab } from './learning-pages'

function Lines() {
  return (
    <>
      <span className="skeleton-line skeleton-title" />
      <span className="skeleton-line" />
      <span className="skeleton-line skeleton-short" />
    </>
  )
}

function Fields({ count = 2, stacked = false }: { count?: number; stacked?: boolean }) {
  return (
    <div className={`loading-fields${stacked ? ' loading-fields-stacked' : ''}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <span className="skeleton-label" />
          <span className="skeleton-field" />
        </div>
      ))}
    </div>
  )
}

function Rows({ count = 3 }: { count?: number }) {
  return (
    <div className="loading-rows">
      {Array.from({ length: count }, (_, index) => (
        <div className="loading-row" key={index}>
          <Lines />
        </div>
      ))}
    </div>
  )
}

function ProjectSkeleton() {
  return (
    <div aria-hidden="true">
      <h2>Build on your own machine</h2>
      <div className="loading-project-intro">
        <span className="skeleton-label" />
      </div>
      <Rows />
    </div>
  )
}

type PageLoadingProps = { page: HubTab; notebookHasDraft?: boolean; notebookHasEntries?: boolean; journalTabs?: ReactNode }

const loadingStatus: Record<HubTab, string> = {
  knowledge: 'Opening lesson…',
  notebook: 'Opening notebook…',
  plan: 'Preparing practice week…',
  assessment: 'Preparing self-assessment…',
  projects: 'Opening projects…',
  interview: 'Preparing interview practice…',
}

/** Pending routes keep the loaded heading and first working surface in the same place. */
export function PageLoading({ page, notebookHasDraft = false, notebookHasEntries = false, journalTabs }: PageLoadingProps) {
  const copy = learningPageTitles[page]
  return (
    <main className={`learning-hub page-loading loading-${page}`} aria-busy="true">
      <PageHeader
        back={learningPageBack[page] && { label: learningPageBack[page].label, onClick: () => goToView(learningPageBack[page]!.view) }}
        title={copy.title}
        description={copy.description}
        actions={page === 'notebook' ? journalTabs : undefined}
      />
      <p className="loading-status page-loading-status" role="status">
        {loadingStatus[page]}
      </p>
      <div aria-hidden="true">
        <PageSkeleton page={page} notebookHasDraft={notebookHasDraft} notebookHasEntries={notebookHasEntries} />
      </div>
    </main>
  )
}

function PageSkeleton({ page, notebookHasDraft, notebookHasEntries }: Required<Omit<PageLoadingProps, 'journalTabs'>>) {
  if (page === 'knowledge')
    return (
      <div className="loading-lesson-layout">
        <aside>
          <span className="skeleton-label" />
          <Fields stacked />
          <Rows />
        </aside>
        <div className="knowledge-article loading-sheet">
          <div className="loading-lesson-heading">
            <div>
              <Lines />
            </div>
            <span className="skeleton-action" />
          </div>
          <div className="loading-tabs">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <Rows />
          <div className="skeleton-code" />
        </div>
      </div>
    )
  if (page === 'notebook')
    return (
      <div className="loading-notebook-surface">
        <div className="hub-heading loading-notebook-heading">
          <div>
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-short" />
          </div>
          <span className="skeleton-action" />
        </div>
        <Fields count={1} />
        {notebookHasDraft ? (
          <div className="hub-panel loading-sheet">
            <Lines />
            <Fields count={1} />
            <Fields count={3} />
            <div className="skeleton-writing" />
            <span className="skeleton-action" />
          </div>
        ) : notebookHasEntries ? (
          <div className="hub-cards">
            {[0, 1].map(index => (
              <div className="hub-panel loading-sheet" key={index}>
                <Lines />
              </div>
            ))}
          </div>
        ) : (
          <div className="hub-empty loading-notebook-empty">
            <Lines />
            <span className="skeleton-action" />
          </div>
        )}
      </div>
    )
  if (page === 'plan')
    return (
      <div className="hub-panel loading-sheet">
        <Lines />
        <Fields />
        <span className="skeleton-label" />
        <div className="loading-week">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
        <Rows />
      </div>
    )
  if (page === 'assessment')
    return (
      <>
        <div className="hub-panel loading-sheet">
          <Lines />
          <span className="skeleton-action" />
        </div>
        <Rows count={3} />
      </>
    )
  if (page === 'projects') return <ProjectSkeleton />
  return (
    <div className="hub-panel loading-sheet loading-interview-sheet">
      <Lines />
      <Fields stacked />
      <span className="skeleton-action" />
    </div>
  )
}

export function ProjectListLoading() {
  return (
    <section className="project-list-loading" aria-busy="true">
      <p className="loading-status page-loading-status" role="status">
        Opening project requirements…
      </p>
      <ProjectSkeleton />
    </section>
  )
}

export function EditorLoading() {
  return (
    <div className="editor-loading" aria-busy="true">
      <p className="loading-status" role="status">
        Opening editor · your saved code stays here
      </p>
      <div className="loading-code-lines" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="loading-code-row" key={index}>
            <span className="skeleton-gutter" />
            <span className="skeleton-line" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PreviewLoading() {
  return (
    <section className="panel frontend-preview preview-loading" aria-busy="true">
      <div className="panel-heading">
        <h2>Interactive preview</h2>
      </div>
      <p className="loading-status page-loading-status" role="status">
        Opening preview controls…
      </p>
      <div aria-hidden="true">
        <div className="loading-preview-description">
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-short" />
        </div>
        <div className="preview-controls loading-preview-controls">
          <span className="skeleton-field" />
          <span className="skeleton-field" />
          <span className="skeleton-action" />
          <span className="skeleton-action" />
        </div>
        <div className="preview-empty loading-preview-empty">
          <span className="skeleton-line" />
        </div>
        <div className="loading-preview-review">
          <span className="skeleton-label" />
        </div>
      </div>
    </section>
  )
}

/** Placeholder shown while a route chunk loads. It keeps the page heading in place so focus and skip links stay valid. */
/** A lazy page's pending state: the page's own frame and header, so its arrival does not move the heading. */
export function RouteLoading({
  title,
  status,
  className,
  eyebrow,
  back,
  actions,
}: {
  title: string
  status: string
  className?: string
  eyebrow?: string
  back?: { label: string; onClick: () => void }
  actions?: ReactNode
}) {
  return (
    <main className={className} aria-busy="true">
      <PageHeader title={title} eyebrow={eyebrow} back={back} actions={actions} />
      <p className="loading-status page-loading-status" role="status">
        {status}
      </p>
    </main>
  )
}

/** Holds the brief's "About this rep" line while it loads, so the brief below does not jump when it arrives. */
export function GuidanceLoading() {
  return (
    <div className="rep-guidance guidance-loading" aria-hidden="true">
      <span className="skeleton-line" />
    </div>
  )
}

/** Holds the SQL brief's Tables card while it loads. The table text itself is never invented. */
export function SqlTablesLoading() {
  return (
    <div className="sql-tables sql-tables-loading" aria-hidden="true">
      <span className="skeleton-line skeleton-short" />
      <span className="skeleton-line" />
      <span className="skeleton-line" />
      <span className="skeleton-line skeleton-short" />
    </div>
  )
}
