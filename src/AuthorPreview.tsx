import { useEffect, useMemo, useState } from 'react'
import { formatLabels } from './catalog-labels.ts'
import { validateContentDepth } from './content-depth.ts'
import { InlineCode } from './InlineCode'
import { Input } from './Input'
import { EmptyState, InfoNote, PageHeader, StatusChip } from './Layout'
import { reflectionGuides } from './reflection-guides.ts'
import { repDepth } from './rep-depth.ts'
import { repLevelLabel } from './rep-levels.ts'
import { validateReps } from './rep-validation.ts'
import { reps } from './rep.ts'
import type { Rep } from './rep-types.ts'
import { TraceViewer } from './TraceViewer'
import './author.css'

const selectedFromHash = () => decodeURIComponent(location.hash.replace(/^#\/author\/?/, ''))

/** Problems the content checks would report for one rep, so an author can fix them before running the full suite. */
function repProblems(rep: Rep) {
  const depth = repDepth[rep.id]
  return [
    ...validateReps([rep], reflectionGuides),
    ...validateContentDepth(new Set([rep.id]), new Set(), depth ? { [rep.id]: depth } : {}, {}),
  ]
}

const json = (value: unknown) => JSON.stringify(value, (_key, item) => (item === undefined ? 'undefined' : item))

/**
 * Development-only preview of authored content at #/author/<rep-id>. It renders everything a learner would see across a
 * rep, including the post-attempt review and traces, without solving the rep first. It never reads or writes learner data.
 */
export function AuthorPreview() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(selectedFromHash)
  useEffect(() => {
    const sync = () => setSelected(selectedFromHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const problemsById = useMemo(() => new Map(reps.map(rep => [rep.id, repProblems(rep)])), [])
  const visible = reps.filter(rep => `${rep.id} ${rep.title} ${rep.category}`.toLowerCase().includes(query.trim().toLowerCase()))
  const rep = reps.find(item => item.id === selected)
  const withProblems = reps.filter(item => problemsById.get(item.id)?.length).length
  return (
    <main className="author-main" id="main-content">
      <PageHeader
        eyebrow="Development only"
        title="Content preview"
        description={`${reps.length} reps; ${withProblems ? `${withProblems} with content problems` : 'no content problems found'}. Learner data is never read or changed here.`}
        actions={
          <Input
            type="search"
            aria-label="Filter reps"
            placeholder="Filter by id, title, or category"
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        }
      />
      <div className="author-layout">
        <nav className="author-list" aria-label="Reps">
          <ul>
            {visible.map(item => {
              const problems = problemsById.get(item.id)?.length ?? 0
              return (
                <li key={item.id}>
                  <a href={`#/author/${encodeURIComponent(item.id)}`} aria-current={item.id === selected ? 'page' : undefined}>
                    <span>{item.title}</span>
                    <small>
                      {item.id}
                      {repDepth[item.id]?.traceSteps ? ' · traced' : ''}
                      {problems ? ` · ${problems} ${problems === 1 ? 'problem' : 'problems'}` : ''}
                    </small>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        {rep ? (
          <RepPreview rep={rep} problems={problemsById.get(rep.id) ?? []} />
        ) : (
          <EmptyState title="Choose a rep">Pick a rep from the list to preview its brief, checks, review, and traces.</EmptyState>
        )}
      </div>
    </main>
  )
}

function RepPreview({ rep, problems }: { rep: Rep; problems: string[] }) {
  const depth = repDepth[rep.id]
  const guide = reflectionGuides[rep.id]
  return (
    <article className="author-rep" aria-labelledby="author-rep-title">
      <header>
        <h2 id="author-rep-title">{rep.title}</h2>
        <p>
          <code>{rep.id}</code> · {rep.category} · {formatLabels[rep.format ?? 'algorithm'] ?? rep.format ?? 'Algorithm'} ·{' '}
          {repLevelLabel(rep.id) ?? 'No level'} · <a href={`#/practice/${encodeURIComponent(rep.id)}`}>Open in practice</a>
        </p>
        {problems.length ? (
          <div className="author-problems" role="alert">
            <StatusChip tone="attention">Needs work</StatusChip>
            <ul>
              {problems.map(problem => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        ) : (
          <StatusChip tone="success">Content checks pass</StatusChip>
        )}
      </header>
      <section aria-labelledby="author-brief">
        <h3 id="author-brief">Brief</h3>
        {rep.context && (
          <p>
            <InlineCode text={rep.context} />
          </p>
        )}
        {rep.errorReport && (
          <pre>
            <code>{rep.errorReport}</code>
          </pre>
        )}
        <p>
          <InlineCode text={rep.prompt} />
        </p>
        {rep.brief && (
          <>
            <h4>Rules, in order</h4>
            <ol>
              {rep.brief.rules.map(rule => (
                <li key={rule}>
                  <InlineCode text={rule} />
                </li>
              ))}
            </ol>
            {rep.brief.edgeCases && (
              <>
                <h4>Edge cases</h4>
                <ul>
                  {rep.brief.edgeCases.map(edge => (
                    <li key={edge}>
                      <InlineCode text={edge} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        <p>
          <strong>Example:</strong> <code>{rep.example.input}</code> → <code>{rep.example.output}</code>
        </p>
        <p>
          <strong>Note:</strong> <InlineCode text={rep.note} />
        </p>
        <p>
          <strong>Plan prompt:</strong> {rep.planPrompt}
        </p>
        <h4>Vocabulary</h4>
        <dl className="author-terms">
          {rep.vocabulary.map(item => (
            <div key={item.term}>
              <dt>{item.term}</dt>
              <dd>
                <InlineCode text={item.meaning} />
              </dd>
            </div>
          ))}
        </dl>
        <h4>Hints, in reveal order</h4>
        <ol>
          {rep.hints.map(hint => (
            <li key={hint}>
              <InlineCode text={hint} />
            </li>
          ))}
        </ol>
      </section>
      <section aria-labelledby="author-starter">
        <h3 id="author-starter">Starter</h3>
        <pre>
          <code>{rep.starter}</code>
        </pre>
      </section>
      <section aria-labelledby="author-checks">
        <h3 id="author-checks">Checks ({rep.checks.length})</h3>
        <table className="author-checks">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Input</th>
              <th scope="col">Expected</th>
            </tr>
          </thead>
          <tbody>
            {rep.checks.map(check => (
              <tr key={check.name}>
                <th scope="row">{check.name}</th>
                <td>
                  <code>{json(check.input)}</code>
                </td>
                <td>
                  <code>{json(check.expected)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section aria-labelledby="author-review">
        <h3 id="author-review">Post-attempt review</h3>
        <InfoNote label="Where learners see this">
          <p>Learners see the review only after their checks pass, under “Compare your plan and explanation”.</p>
        </InfoNote>
        {guide && (
          <>
            <h4>Self-review guide</h4>
            <p>Plan: {guide.plan.join(' ')}</p>
            <p>Explanation: {guide.explanation.join(' ')}</p>
            <p>Example: {guide.example}</p>
          </>
        )}
        {depth ? (
          <>
            <h4>Why this works</h4>
            <p>{depth.reasoning}</p>
            <h4>Trace a boundary case</h4>
            <p>{depth.trace}</p>
            {depth.traceSteps && <TraceViewer key={rep.id} trace={depth.traceSteps} />}
            <h4>Compare approaches</h4>
            <p>{depth.alternative}</p>
            {depth.alternativeTrace && (
              <TraceViewer key={`${rep.id}-alternative`} trace={depth.alternativeTrace.trace} title={depth.alternativeTrace.title} />
            )}
            <h4>A tempting mistake</h4>
            <p>{depth.counterexample}</p>
            <h4>Try a variation</h4>
            <p>{depth.transfer}</p>
          </>
        ) : (
          <p>No authored depth entry yet.</p>
        )}
      </section>
    </article>
  )
}
