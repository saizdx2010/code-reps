import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { repSummaryById as repById } from './rep-index.ts'
import { catalogTopic } from './catalog-labels.ts'
import { confidenceLabels, difficultyLabels } from './attempt-labels.ts'
import type { Confidence, Difficulty } from './attempt-labels.ts'
import { DateInput } from './DateInput'
import { Input, Select } from './Input'
import { Button } from './Button'
import { EmptyState, PageHeader } from './Layout'
import { formatDate, plural } from './ui-copy.ts'
import { useSessionPreference } from './useSessionPreference'

type AttemptRecord = {
  id: string
  repId: string
  completedAt: string
  plan: string
  code: string
  explanation: string
  hintCount: number
  difficulty?: Difficulty
  confidence?: Confidence
}
type Props = { history: AttemptRecord[]; categories: string[]; journalTabs: ReactNode; openRep: (id: string) => void }

export function HistoryPage({ history, categories, journalTabs, openRep }: Props) {
  const [historyQuery, setHistoryQuery] = useSessionPreference<string>('historyQuery', '')
  const [historySkill, setHistorySkill] = useSessionPreference<string>('historySkill', '')
  const [historyDifficulty, setHistoryDifficulty] = useSessionPreference<string>('historyDifficulty', '')
  const [historyDate, setHistoryDate] = useSessionPreference<string>('historyDate', '')
  // Each attempt's previous attempt at the same rep, found in one sorted pass instead of per row.
  const previousAttempts = useMemo(() => {
    const previous = new Map<string, AttemptRecord>()
    const lastByRep = new Map<string, AttemptRecord>()
    for (const record of [...history].sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt))) {
      const last = lastByRep.get(record.repId)
      if (last && Date.parse(last.completedAt) < Date.parse(record.completedAt)) previous.set(record.id, last)
      else if (last) {
        const before = previous.get(last.id)
        if (before) previous.set(record.id, before)
      }
      if (!last || Date.parse(last.completedAt) < Date.parse(record.completedAt)) lastByRep.set(record.repId, record)
    }
    return previous
  }, [history])
  const visibleHistory = useMemo(
    () =>
      history.filter(record => {
        const item = repById.get(record.repId)
        const day = (value: string) => new Date(value).toLocaleDateString('en-CA')
        return (
          (!historyQuery || `${item?.title ?? ''} ${item?.category ?? ''}`.toLowerCase().includes(historyQuery.toLowerCase())) &&
          (!historySkill || Boolean(item && catalogTopic(item) === historySkill)) &&
          (!historyDifficulty || record.difficulty === historyDifficulty) &&
          (!historyDate || day(record.completedAt) === day(`${historyDate}T12:00:00`))
        )
      }),
    [history, historyQuery, historySkill, historyDifficulty, historyDate],
  )
  const [filterPanel, setFilterPanel] = useSessionPreference<'open' | 'closed'>(
    'history-filters',
    matchMedia('(min-width: 901px)').matches ? 'open' : 'closed',
  )
  const activeFilters = [historySkill, historyDifficulty, historyDate].filter(Boolean).length
  function clearFilters() {
    setHistoryQuery('')
    setHistorySkill('')
    setHistoryDifficulty('')
    setHistoryDate('')
  }
  return (
    <main className="history-main">
      <PageHeader
        eyebrow="Journal"
        title="Attempt history"
        description="Completed reps stay here so you can compare your thinking over time."
        actions={journalTabs}
      />
      <label className="history-search">
        Find an attempt
        <Input type="search" value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Rep or skill…" />
      </label>
      {/* Like the Library, the filters fold away on narrow screens so the attempts come first. */}
      <details
        className="catalog-filters history-filters"
        open={filterPanel === 'open'}
        onToggle={event => setFilterPanel(event.currentTarget.open ? 'open' : 'closed')}
      >
        <summary>Filters{activeFilters > 0 && <span>{activeFilters} active</span>}</summary>
        <div className="filter-bar" aria-label="History filters">
          <label>
            Skill
            <Select aria-label="Skill" value={historySkill} onChange={event => setHistorySkill(event.target.value)}>
              <option value="">All skills</option>
              {categories.map(category => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </label>
          <label>
            Difficulty
            <Select aria-label="Difficulty" value={historyDifficulty} onChange={event => setHistoryDifficulty(event.target.value)}>
              <option value="">Any difficulty</option>
              {Object.entries(difficultyLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Date
            <DateInput value={historyDate} onValueChange={setHistoryDate} />
          </label>
          <Button variant="text" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </details>
      <p className="utility-note" aria-live="polite">
        {visibleHistory.length} matching {plural(visibleHistory.length, 'attempt')}
      </p>
      {history.length === 0 ? (
        <EmptyState title="No completed attempts yet.">Finish a rep to save your first one here.</EmptyState>
      ) : (
        <ol className="history-list">
          {visibleHistory.map(record => (
            <AttemptRow key={record.id} record={record} previous={previousAttempts.get(record.id)} openRep={openRep} />
          ))}
        </ol>
      )}
      {history.length > 0 && !visibleHistory.length && (
        <EmptyState
          title="No attempts match these filters."
          action={
            <Button variant="text" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        >
          Try another search or date.
        </EmptyState>
      )}
    </main>
  )
}

function AttemptRow({ record, previous, openRep }: { record: AttemptRecord; previous?: AttemptRecord; openRep: (id: string) => void }) {
  const item = repById.get(record.repId)
  return (
    <li data-attempt-id={record.id}>
      <div>
        <strong>{item?.title ?? 'Unknown rep'}</strong>
        <span>
          {formatDate(record.completedAt, true)} · {record.hintCount} {plural(record.hintCount, 'hint')} used
        </span>
        {item && (
          <Button variant="text" onClick={() => openRep(item.id)}>
            Open rep
          </Button>
        )}
      </div>
      <details>
        <summary>Review attempt</summary>
        {record.difficulty && <p className="reflection-detail">Difficulty: {difficultyLabels[record.difficulty]}</p>}
        {record.confidence && <p className="reflection-detail">Confidence: {confidenceLabels[record.confidence]}</p>}
        {previous && (
          <section className="attempt-compare">
            <strong>Since your previous attempt</strong>
            <p>
              Hints: {previous.hintCount} {record.hintCount}. Compare the code and any written reasoning below; the app does not grade their
              quality.
            </p>
            <div className="attempt-comparison">
              <AttemptWork heading={`Previous · ${formatDate(previous.completedAt)}`} record={previous} />
              <AttemptWork heading={`This attempt · ${formatDate(record.completedAt)}`} record={record} />
            </div>
          </section>
        )}
        {record.plan.trim() && (
          <>
            <h3>Plan</h3>
            <p>{record.plan}</p>
          </>
        )}
        <h3>Code</h3>
        <pre>
          <code>{record.code}</code>
        </pre>
        {record.explanation.trim() && (
          <>
            <h3>Explanation</h3>
            <p>{record.explanation}</p>
          </>
        )}
      </details>
    </li>
  )
}

/** One side of the comparison with the previous attempt at the same rep. */
function AttemptWork({ heading, record }: { heading: string; record: AttemptRecord }) {
  return (
    <div>
      <h4>{heading}</h4>
      {record.plan.trim() && (
        <>
          <h5>Plan</h5>
          <p>{record.plan}</p>
        </>
      )}
      <h5>Code</h5>
      <pre>
        <code>{record.code}</code>
      </pre>
      {record.explanation.trim() && (
        <>
          <h5>Explanation</h5>
          <p>{record.explanation}</p>
        </>
      )}
    </div>
  )
}
