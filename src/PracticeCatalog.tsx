import { Input, Select } from './Input'
import { preloadEditor } from './editor-loader'
import { useSessionPreference } from './useSessionPreference'
import { reps } from './rep'
import type { Rep } from './rep'

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
}

const formatLabels: Record<string, string> = { algorithm: 'Algorithm / TypeScript', debug: 'Debugging', read: 'Code reading', transform: 'Data transformation', frontend: 'Frontend', backend: 'Backend', refactor: 'Refactoring' }

export function PracticeCatalog({ filters, onFilter, clearFilters, categories, visibleReps, dueIds, repStatus, openRep }: Props) {
  const [filterPanel, setFilterPanel] = useSessionPreference<'open' | 'closed'>('catalog-filters', matchMedia('(min-width: 901px)').matches ? 'open' : 'closed')
  const activeFilters = [filters.skill, filters.format, filters.status].filter(Boolean).length
  return <main className="catalog-main">
    <div className="catalog-heading">
      <div>
        <h1 tabIndex={-1}>Find your next rep.</h1>
        <p>Choose a skill to practise. Pick up saved work at any time.</p>
      </div>
      <div className="catalog-search">
        <label htmlFor="catalog-query">Find a rep</label>
        <Input id="catalog-query" type="search" value={filters.query} onChange={(event) => onFilter('query', event.target.value)} placeholder="Try arrays, strings, debugging…" />
      </div>
    </div>
    <details className="catalog-filters" open={filterPanel === 'open'} onToggle={event => setFilterPanel(event.currentTarget.open ? 'open' : 'closed')}>
    <summary>Filters{activeFilters > 0 && <span>{activeFilters} active</span>}</summary>
    <div className="filter-bar" aria-label="Practice filters">
      <label>Skill<Select aria-label="Skill" value={filters.skill} onChange={event => onFilter('skill', event.target.value)}>
          <option value="">All skills</option>{categories.map(category => <option key={category}>{category}</option>)}</Select>
      </label>
      <label>Format<Select aria-label="Format" value={filters.format} onChange={event => onFilter('format', event.target.value)}>
          <option value="">All formats</option>{[...new Set(reps.map(item => item.format ?? 'algorithm'))].map(format => <option key={format} value={format}>{formatLabels[format]}</option>)}</Select>
      </label>
      <label>Status<Select aria-label="Status" value={filters.status} onChange={event => onFilter('status', event.target.value)}>
          <option value="">All statuses</option>{['Not started', 'In progress', 'Completed'].map(status => <option key={status}>{status}</option>)}<option value="review">Review due</option>
        </Select>
      </label>
      <button type="button" className="text-button" onClick={clearFilters}>Clear filters</button>
    </div></details>
    <div className="catalog-list-heading">
      <h2>{filters.query.trim() ? 'Search results' : 'All exercises'}</h2>
      <span aria-live="polite">{visibleReps.length} {visibleReps.length === 1 ? 'rep' : 'reps'}</span>
    </div>
    <div className="catalog-list" role="region" aria-label="Exercise list" tabIndex={0}>{visibleReps.length ? visibleReps.map((item) => <button className="rep-list-row" type="button" key={item.id} onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openRep(item.id)}>
        <span className="rep-list-name">
          <strong>{item.title}</strong>
          <small><span>{item.category}</span><span>{formatLabels[item.format ?? 'algorithm']}</span>{dueIds.has(item.id) && <span className="review-due">Review due</span>}</small>
        </span>
        <span className={`rep-list-status ${repStatus(item).toLowerCase().replace(' ', '-')}`}>{repStatus(item)}</span>
      </button>) : <p className="catalog-empty">No reps match these filters. Clear filters or try a shorter search.</p>}</div>
  </main>
}
