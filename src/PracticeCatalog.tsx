import { catalogTopic, formatLabels } from './catalog-labels.ts'
import { EmptyState, ListGroup, ListRow, PageHeader, StatusChip } from './Layout'
import { statusTone } from './ui-status'
import { Input, Select } from './Input'
import { preloadEditor } from './editor-loader'
import { useSessionPreference } from './useSessionPreference'
import { reps } from './rep'
import type { Rep } from './rep'
import { repLevel, repLevelLabel } from './rep-levels.ts'
import { startHereReps } from './catalog-sample.ts'
import { foundationsPathId } from './curriculum'
import { paths } from './path'

type Filter = 'query' | 'skill' | 'format' | 'status'
type Props = {
  filters: Record<Filter, string>
  onFilter: (field: Filter, value: string) => void
  clearFilters: () => void
  categories: string[]
  visibleReps: Rep[]
  dueIds: Set<string>
  repStatus: (rep: Rep) => string
  openRep: (id: string) => void
  goalPathId?: string
}

const pathRepIds = (id: string): string[] => paths.find(path => path.id === id)?.stages.flatMap(stage => [...stage.repIds]) ?? []

export function PracticeCatalog({ filters, onFilter, clearFilters, categories, visibleReps, dueIds, repStatus, openRep, goalPathId = foundationsPathId }: Props) {
  const [filterPanel, setFilterPanel] = useSessionPreference<'open' | 'closed'>('catalog-filters', matchMedia('(min-width: 901px)').matches ? 'open' : 'closed')
  const activeFilters = [filters.skill, filters.format, filters.status].filter(Boolean).length
  const [openGroups, setOpenGroups] = useSessionPreference<string>('catalog-groups', '[]')
  let expanded: string[] = []
  try { const saved: unknown = JSON.parse(openGroups); if (Array.isArray(saved)) expanded = saved.filter((value): value is string => typeof value === 'string') } catch { /* Start collapsed if the session preference is unavailable. */ }
  const filtering = Boolean(filters.query.trim() || activeFilters)
  const startHere = startHereReps(visibleReps, { pathRepIds: pathRepIds(goalPathId), isDone: item => repStatus(item) === 'Completed', level: repLevel })
  const renderRow = (item: Rep) => <ListRow key={item.id} title={item.title} meta={<>{formatLabels[item.format ?? 'algorithm']}{dueIds.has(item.id) && ' · Review due'}</>} status={<>{repLevelLabel(item.id) && <StatusChip>{repLevelLabel(item.id)}</StatusChip>}<StatusChip tone={statusTone(repStatus(item))}>{repStatus(item)}</StatusChip></>} onPreview={preloadEditor} onOpen={() => openRep(item.id)} />
  return <main className="catalog-main">
    <PageHeader title="Find your next rep." description="Choose a skill to practice. Pick up saved work at any time." actions={<div className="catalog-search"><label htmlFor="catalog-query">Find a rep</label><Input id="catalog-query" type="search" value={filters.query} onChange={event => onFilter('query', event.target.value)} placeholder="Try arrays, strings, debugging…" /></div>} />
    <details className="catalog-filters" open={filterPanel === 'open'} onToggle={event => setFilterPanel(event.currentTarget.open ? 'open' : 'closed')}>
    <summary>Filters{activeFilters > 0 && <span>{activeFilters} active</span>}</summary>
    <div className="filter-bar" aria-label="Practice filters">
      <label>Topic<Select aria-label="Topic" value={filters.skill} onChange={event => onFilter('skill', event.target.value)}>
          <option value="">All topics</option>{categories.map(category => <option key={category}>{category}</option>)}</Select>
      </label>
      <label>Type of rep<Select aria-label="Type of rep" value={filters.format} onChange={event => onFilter('format', event.target.value)}>
          <option value="">All types</option>{[...new Set(reps.map(item => item.format ?? 'algorithm'))].map(format => <option key={format} value={format}>{formatLabels[format]}</option>)}</Select>
      </label>
      <label>Your progress<Select aria-label="Your progress" value={filters.status} onChange={event => onFilter('status', event.target.value)}>
          <option value="">Any progress</option>{['Not started', 'In progress', 'Completed'].map(status => <option key={status}>{status}</option>)}<option value="review">Review due</option>
        </Select>
      </label>
      <button type="button" className="text-button" onClick={clearFilters}>Clear filters</button>
    </div></details>
    {!filtering && startHere.length > 0 && <div className="catalog-start"><ListGroup title="Start here" count={startHere.length} open>{startHere.map(renderRow)}</ListGroup></div>}
    <div className="catalog-list-heading">
      <h2>{filters.query.trim() ? 'Search results' : 'All exercises'}</h2>
      <span aria-live="polite">{visibleReps.length} {visibleReps.length === 1 ? 'rep' : 'reps'}</span>
    </div>
    <div className="catalog-list" data-filtering={filtering} role="region" aria-label="Exercise list">{visibleReps.length ? categories.map(category => {
      const items = visibleReps.filter(item => catalogTopic(item) === category)
      return items.length > 0 && <ListGroup key={category} title={category} count={items.length} open={filtering || expanded.includes(category)} onToggle={open => { if (!filtering) setOpenGroups(JSON.stringify(open ? [...new Set([...expanded, category])] : expanded.filter(value => value !== category))) }}>
        {items.map(renderRow)}
      </ListGroup>
    }) : <EmptyState title="No reps match these filters." action={<button type="button" className="text-button" onClick={clearFilters}>Clear filters</button>}>Try a shorter search.</EmptyState>}</div>
  </main>
}
