import { Button } from './Button'
import { catalogArea, catalogAreas, catalogTopic, formatLabels } from './catalog-labels.ts'
import { EmptyState, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { statusTone } from './ui-status'
import { Input, Select } from './Input'
import { preloadEditor } from './editor-loader'
import { useSessionPreference } from './useSessionPreference'
import { repIndex as reps } from './catalog-index'
import type { RepSummary } from './catalog-index'
import { repLevel, repLevelLabel, repLevelLabels } from './rep-levels.ts'
import type { SkillSummary } from './catalog-index'
import { startHereReps } from './catalog-sample.ts'
import { foundationsPathId } from './curriculum'
import { paths } from './path'
import { plural } from './ui-copy.ts'

type Filter = 'query' | 'skill' | 'format' | 'status' | 'level'
type Props = {
  filters: Record<Filter, string>
  onFilter: (field: Filter, value: string) => void
  clearFilters: () => void
  categories: string[]
  visibleReps: RepSummary[]
  dueIds: Set<string>
  repStatus: (rep: RepSummary) => string
  openRep: (id: string) => void
  goalPathId?: string
  /** Lessons that mention the search, offered when no rep does. */
  lessonMatches: SkillSummary[]
  openLesson: (id: string) => void
}

const pathRepIds = (id: string): string[] => paths.find(path => path.id === id)?.stages.flatMap(stage => [...stage.repIds]) ?? []

/** Session-stored group names; a missing or invalid preference starts every group collapsed. */
function parseOpenGroups(value: string): string[] {
  try {
    const saved: unknown = JSON.parse(value)
    if (Array.isArray(saved)) return saved.filter((item): item is string => typeof item === 'string')
  } catch {
    /* Start collapsed if the session preference is unavailable. */
  }
  return []
}

export function PracticeCatalog(props: Props) {
  const { filters, onFilter, clearFilters, categories, visibleReps, dueIds, repStatus, openRep, goalPathId = foundationsPathId } = props
  const { lessonMatches, openLesson } = props
  const [filterPanel, setFilterPanel] = useSessionPreference<'open' | 'closed'>(
    'catalog-filters',
    matchMedia('(min-width: 901px)').matches ? 'open' : 'closed',
  )
  const activeFilters = [filters.skill, filters.format, filters.status, filters.level].filter(Boolean).length
  const [openGroups, setOpenGroups] = useSessionPreference<string>('catalog-groups', '[]')
  const expanded = parseOpenGroups(openGroups)
  const filtering = Boolean(filters.query.trim() || activeFilters)
  const startHere = startHereReps(visibleReps, {
    pathRepIds: pathRepIds(goalPathId),
    isDone: item => repStatus(item) === 'Completed',
    level: repLevel,
  })
  function toggleGroup(category: string, open: boolean) {
    if (filtering) return
    setOpenGroups(JSON.stringify(open ? [...new Set([...expanded, category])] : expanded.filter(value => value !== category)))
  }
  // Rows stay quiet: the format only when it is not a plain exercise, and a status chip only once there is a status.
  const renderRow = (item: RepSummary) => {
    const status = repStatus(item)
    const format = item.format ? formatLabels[item.format] : ''
    const meta = [format, dueIds.has(item.id) ? 'Review due' : ''].filter(Boolean).join(' · ')
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
        onPreview={preloadEditor}
        onOpen={() => openRep(item.id)}
      />
    )
  }
  // Easiest first inside a topic; equal levels keep authored order.
  const byLevel = (items: RepSummary[]) => [...items].sort((a, b) => (repLevel(a.id) ?? 4) - (repLevel(b.id) ?? 4))
  const done = (items: RepSummary[]) => items.filter(item => repStatus(item) === 'Completed').length
  const query = filters.query.trim()
  const statusEmpty: Record<string, string> = {
    Completed: 'No completed reps yet. Finish a rep and it appears here.',
    'In progress': 'Nothing in progress. Reps you start and leave unfinished appear here.',
    review: 'Nothing to review today. Reviews appear a few days after you complete a rep.',
  }
  return (
    <main className="catalog-main">
      <PageHeader
        title="Find your next rep"
        description="Choose a skill to practice. Pick up saved work at any time."
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
      <details
        className="catalog-filters"
        open={filterPanel === 'open'}
        onToggle={event => setFilterPanel(event.currentTarget.open ? 'open' : 'closed')}
      >
        <summary>Filters{activeFilters > 0 && <span>{activeFilters} active</span>}</summary>
        <div className="filter-bar" aria-label="Practice filters">
          <label>
            Topic
            <Select aria-label="Topic" value={filters.skill} onChange={event => onFilter('skill', event.target.value)}>
              <option value="">All topics</option>
              {categories.map(category => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </label>
          <label>
            Type of rep
            <Select aria-label="Type of rep" value={filters.format} onChange={event => onFilter('format', event.target.value)}>
              <option value="">All types</option>
              {[...new Set(reps.map(item => item.format ?? 'algorithm'))].map(format => (
                <option key={format} value={format}>
                  {formatLabels[format]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            Level
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
            Your progress
            <Select aria-label="Your progress" value={filters.status} onChange={event => onFilter('status', event.target.value)}>
              <option value="">Any progress</option>
              {['Not started', 'In progress', 'Completed'].map(status => (
                <option key={status}>{status}</option>
              ))}
              <option value="review">Review due</option>
            </Select>
          </label>
          <Button variant="text" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      </details>
      {!filtering && startHere.length > 0 && (
        <div className="catalog-start">
          <ListGroup title="Start here" count={startHere.length} open>
            {startHere.map(renderRow)}
          </ListGroup>
        </div>
      )}
      <div className="catalog-list-heading">
        <h2>{query ? 'Search results' : 'All exercises'}</h2>
        <span aria-live="polite">
          {visibleReps.length} {plural(visibleReps.length, 'rep')}
        </span>
      </div>
      <div className="catalog-list" data-filtering={filtering} role="region" aria-label="Exercise list">
        {visibleReps.length ? (
          catalogAreas.map(area => {
            const topics = categories.filter(category => catalogArea(category) === area.title)
            const areaReps = visibleReps.filter(item => topics.includes(catalogTopic(item)))
            if (!areaReps.length) return null
            return (
              <section key={area.title} className="catalog-area" aria-labelledby={`area-${area.title}`}>
                <div className="catalog-area-heading">
                  <h3 id={`area-${area.title}`}>{area.title}</h3>
                  <span>
                    {done(areaReps)} of {areaReps.length} done
                  </span>
                </div>
                {topics.map(category => {
                  const items = areaReps.filter(item => catalogTopic(item) === category)
                  return (
                    items.length > 0 && (
                      <ListGroup
                        key={category}
                        title={category}
                        meta={
                          <>
                            <span className="topic-meter" aria-hidden="true">
                              <span style={{ width: `${(done(items) / items.length) * 100}%` }} />
                            </span>
                            {done(items)} of {items.length} done
                          </>
                        }
                        open={filtering || expanded.includes(category)}
                        onToggle={open => toggleGroup(category, open)}
                      >
                        {byLevel(items).map(renderRow)}
                      </ListGroup>
                    )
                  )
                })}
              </section>
            )
          })
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
              <p>Try another word, or clear the search to browse every area.</p>
            )}
          </EmptyState>
        ) : (
          <EmptyState
            title="No reps match these filters."
            action={
              <Button variant="text" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          >
            {statusEmpty[filters.status] ?? 'Try a different topic, level, or type of rep.'}
          </EmptyState>
        )}
      </div>
    </main>
  )
}
