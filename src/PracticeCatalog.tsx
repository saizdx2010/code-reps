import { useRef } from 'react'
import { Button } from './Button'
import { catalogArea, catalogAreas, catalogTopic, formatLabels } from './catalog-labels.ts'
import { EmptyState, ListRow, PageHeader, StatusChip } from './Layout'
import { statusTone } from './ui-status'
import { Input, Select } from './Input'
import { preloadPractice } from './editor-loader'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import { repLevel, repLevelLabel, repLevelLabels } from './rep-levels.ts'
import type { SkillSummary } from './catalog-index'
import { startHereReps } from './catalog-sample.ts'
import { foundationsPathId } from './curriculum'
import { paths } from './path'
import { plural } from './ui-copy.ts'
import { reducedMotion } from './ui-motion'
import './catalog.css'

type Filter = 'query' | 'format' | 'level'
type Props = {
  filters: Record<Filter, string>
  onFilter: (field: Filter, value: string) => void
  clearFilters: () => void
  /** The open shelf: a topic name, or one of the progress shelves below. Empty picks a sensible first shelf. */
  shelf: string
  onShelf: (shelf: string) => void
  categories: string[]
  /** Reps that match the search, level, and type: the search results. */
  visibleReps: RepSummary[]
  /** Reps that match the level and type only; the rail and shelves ignore the search. */
  browseReps: RepSummary[]
  dueIds: Set<string>
  repStatus: (rep: RepSummary) => string
  openRep: (id: string) => void
  goalPathId?: string
  /** Lessons that mention the search, offered when no rep does. */
  lessonMatches: SkillSummary[]
  openLesson: (id: string) => void
}

// Progress shelves sit above the topics. Their ids start with a colon so they never collide with a topic name.
const shelves = {
  start: { id: ':start', title: 'Start here' },
  progress: { id: ':progress', title: 'In progress' },
  review: { id: ':review', title: 'Review due' },
  done: { id: ':done', title: 'Completed' },
} as const

const pathRepIds = (id: string): string[] => paths.find(path => path.id === id)?.stages.flatMap(stage => [...stage.repIds]) ?? []

export function PracticeCatalog(props: Props) {
  const {
    filters,
    onFilter,
    clearFilters,
    categories,
    visibleReps,
    browseReps,
    dueIds,
    repStatus,
    openRep,
    goalPathId = foundationsPathId,
  } = props
  const { lessonMatches, openLesson, shelf: savedShelf, onShelf } = props
  const paneRef = useRef<HTMLElement>(null)
  const query = filters.query.trim()
  const narrowed = Boolean(filters.level || filters.format)
  const done = (items: RepSummary[]) => items.filter(item => repStatus(item) === 'Completed').length
  const shelfReps: Record<string, RepSummary[]> = {
    [shelves.start.id]: startHereReps(browseReps, {
      pathRepIds: pathRepIds(goalPathId),
      isDone: item => repStatus(item) === 'Completed',
      level: repLevel,
    }),
    [shelves.progress.id]: browseReps.filter(item => repStatus(item) === 'In progress'),
    [shelves.review.id]: browseReps.filter(item => dueIds.has(item.id)),
    [shelves.done.id]: browseReps.filter(item => repStatus(item) === 'Completed'),
  }
  // Empty progress shelves stay out of the rail, except the one already open, so a filter never makes the page jump.
  const progressShelves = Object.values(shelves).filter(item => shelfReps[item.id].length > 0 || item.id === savedShelf)
  const topicReps = (topic: string) => browseReps.filter(item => catalogTopic(item) === topic)
  const known = savedShelf in shelfReps || categories.includes(savedShelf)
  const shelf = known ? savedShelf : (progressShelves.find(item => item.id !== shelves.done.id)?.id ?? categories[0])
  const shelfTitle = Object.values(shelves).find(item => item.id === shelf)?.title
  // Easiest first inside a topic; equal levels keep authored order. Progress shelves keep their own order.
  const byLevel = (items: RepSummary[]) => [...items].sort((a, b) => (repLevel(a.id) ?? 4) - (repLevel(b.id) ?? 4))
  const shown = query ? visibleReps : shelfTitle ? shelfReps[shelf] : byLevel(topicReps(shelf))
  // Every topic in the rail, in area order, so the pane can offer the next one.
  const order = catalogAreas.flatMap(area => categories.filter(category => catalogArea(category) === area.title))
  const nextTopic = !shelfTitle && !query ? order[order.indexOf(shelf) + 1] : undefined

  function choose(next: string) {
    onShelf(next)
    if (query) onFilter('query', '')
    // On a narrow screen the list sits below the picker; bring its heading into view without stealing focus from the rail.
    requestAnimationFrame(() => {
      const pane = paneRef.current
      if (pane && pane.getBoundingClientRect().top < 0)
        pane.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' })
    })
  }
  // Rows stay quiet: the format only when it is not a plain exercise, and a status chip only once there is a status.
  const renderRow = (item: RepSummary) => {
    const status = repStatus(item)
    const format = item.format ? formatLabels[item.format] : ''
    // Outside a topic, the row says which topic it comes from.
    const meta = [
      !shelfTitle && !query ? '' : catalogTopic(item),
      format,
      dueIds.has(item.id) && shelf !== shelves.review.id ? 'Review due' : '',
    ]
      .filter(Boolean)
      .join(' · ')
    return (
      <ListRow
        key={item.id}
        title={item.title}
        meta={meta || undefined}
        status={
          <>
            {repLevelLabel(item.id) && <span className="list-row-level">{repLevelLabel(item.id)}</span>}
            {status === 'Not started' ? (
              <span className="visually-hidden">Not started</span>
            ) : (
              <StatusChip tone={statusTone(status)}>{status}</StatusChip>
            )}
          </>
        }
        onPreview={() => preloadPractice(item.id)}
        onOpen={() => openRep(item.id)}
      />
    )
  }
  const railButton = (id: string, title: string, items: RepSummary[], count: string, spoken: string) => (
    <Button
      type="button"
      key={id}
      aria-current={!query && shelf === id ? 'page' : undefined}
      onClick={() => choose(id)}
      onMouseEnter={() => items[0] && preloadPractice(items[0].id)}
    >
      <strong>{title}</strong>
      <span className="catalog-rail-count" aria-hidden="true">
        {count}
      </span>
      <span className="visually-hidden">{spoken}</span>
    </Button>
  )
  const statusEmpty: Record<string, string> = {
    [shelves.done.id]: 'No completed reps yet. Finish a rep and it appears here.',
    [shelves.progress.id]: 'Nothing in progress. Reps you start and leave unfinished appear here.',
    [shelves.review.id]: 'Nothing to review today. Reviews appear a few days after you complete a rep.',
    [shelves.start.id]: 'You have finished every suggested starting rep. Pick a topic to keep going.',
  }
  const paneTitle = query ? 'Search results' : (shelfTitle ?? shelf)
  const paneArea = query ? `Every topic` : shelfTitle ? 'Your progress' : catalogArea(shelf)
  return (
    <main className="catalog-main">
      <PageHeader
        title="Find your next rep"
        description={`${reps.length} reps in ${catalogAreas.length} areas. Pick a topic, then a rep.`}
        actions={
          <div className="catalog-search">
            <label htmlFor="catalog-query">Find a rep</label>
            <Input
              id="catalog-query"
              type="search"
              value={filters.query}
              onChange={event => onFilter('query', event.target.value)}
              placeholder="Try arrays, strings, debugging…"
            />
          </div>
        }
      />
      <div className="catalog-browser">
        <div className="catalog-rail">
          {/* A narrow screen has no room for the rail; the same choice becomes one menu. */}
          <label className="catalog-rail-picker">
            Topic
            <Select value={query ? '' : shelf} onChange={event => event.target.value && choose(event.target.value)}>
              {query && <option value="">Search results</option>}
              {progressShelves.map(item => (
                <option key={item.id} value={item.id}>
                  {item.title} ({shelfReps[item.id].length})
                </option>
              ))}
              {order.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </Select>
          </label>
          <nav className="catalog-rail-list" aria-label="Topics">
            {progressShelves.length > 0 && (
              <div className="catalog-rail-group">
                {progressShelves.map(item =>
                  railButton(
                    item.id,
                    item.title,
                    shelfReps[item.id],
                    String(shelfReps[item.id].length),
                    `${shelfReps[item.id].length} ${plural(shelfReps[item.id].length, 'rep')}`,
                  ),
                )}
              </div>
            )}
            {catalogAreas.map(area => {
              const topics = order.filter(topic => catalogArea(topic) === area.title)
              if (!topics.length) return null
              return (
                <div className="catalog-rail-group" key={area.title}>
                  <h2>{area.title}</h2>
                  {topics.map(topic => {
                    const items = topicReps(topic)
                    // Unfiltered, a topic shows progress through it; filtered, how many reps still match.
                    return narrowed
                      ? railButton(topic, topic, items, String(items.length), `${items.length} matching`)
                      : railButton(topic, topic, items, `${done(items)}/${items.length}`, `${done(items)} of ${items.length} done`)
                  })}
                </div>
              )
            })}
          </nav>
        </div>
        <section ref={paneRef} className="catalog-pane" aria-labelledby="catalog-pane-title">
          <header className="catalog-pane-header">
            <div>
              <span className="catalog-pane-area">{paneArea}</span>
              <h2 id="catalog-pane-title">{paneTitle}</h2>
              <span className="catalog-pane-count" aria-live="polite">
                {!query && !shelfTitle && shown.length > 0 ? (
                  <>
                    <span className="topic-meter" aria-hidden="true">
                      <span style={{ width: `${(done(shown) / shown.length) * 100}%` }} />
                    </span>
                    {done(shown)} of {shown.length} done
                  </>
                ) : (
                  `${shown.length} ${plural(shown.length, 'rep')}`
                )}
              </span>
            </div>
            <div className="catalog-pane-filters" aria-label="Practice filters" role="group">
              <label>
                <span className="visually-hidden">Level</span>
                <Select aria-label="Level" value={filters.level} onChange={event => onFilter('level', event.target.value)}>
                  <option value="">Any level</option>
                  {Object.entries(repLevelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="visually-hidden">Type of rep</span>
                <Select aria-label="Type of rep" value={filters.format} onChange={event => onFilter('format', event.target.value)}>
                  <option value="">All types</option>
                  {[...new Set(reps.map(item => item.format ?? 'algorithm'))].map(format => (
                    <option key={format} value={format}>
                      {formatLabels[format]}
                    </option>
                  ))}
                </Select>
              </label>
              {(narrowed || query) && (
                <Button variant="text" className="clear-filters" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </header>
          {shown.length ? (
            <ul key={query ? 'search' : shelf} className="list-rows catalog-list" aria-label="Exercise list">
              {shown.map(renderRow)}
            </ul>
          ) : query ? (
            <EmptyState
              title={`No reps mention “${query}”.`}
              action={
                <Button variant="text" onClick={() => onFilter('query', '')}>
                  Clear search
                </Button>
              }
            >
              {lessonMatches.length ? (
                <>
                  <p>
                    {lessonMatches.length === 1 ? 'A lesson covers it' : `${lessonMatches.length} lessons cover it`}, and each links to
                    practice reps.
                  </p>
                  <ul className="list-rows catalog-lesson-matches">
                    {lessonMatches.map(skill => (
                      <ListRow
                        key={skill.id}
                        title={skill.title}
                        meta={`Lesson · ${skill.repIds.length} ${plural(skill.repIds.length, 'practice rep')}`}
                        onOpen={() => openLesson(skill.id)}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <p>Try another word, or clear the search to browse every topic.</p>
              )}
            </EmptyState>
          ) : narrowed ? (
            <EmptyState
              title="No reps here match these filters."
              action={
                <Button variant="text" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            >
              Try another level or type of rep, or another topic.
            </EmptyState>
          ) : (
            <EmptyState title={`Nothing in ${paneTitle} yet.`}>{statusEmpty[shelf] ?? 'Pick another topic.'}</EmptyState>
          )}
          {nextTopic && shown.length > 0 && (
            <button type="button" className="catalog-next-topic" onClick={() => choose(nextTopic)}>
              <span>Next topic</span>
              <strong>{nextTopic}</strong>
            </button>
          )}
        </section>
      </div>
    </main>
  )
}
