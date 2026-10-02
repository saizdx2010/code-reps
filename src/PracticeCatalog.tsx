import { Input, Select } from './Input'
import { preloadEditor } from './editor-loader'
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
  return <main className="catalog-main">
    <div className="catalog-heading">
      <div>
        <span className="home-label">PRACTICE LIBRARY</span>
        <h1 tabIndex={-1}>Choose your next rep.</h1>
        <p>Search by title or skill. Your draft is saved when you switch exercises.</p>
      </div>
      <div className="catalog-search">
        <label htmlFor="catalog-query">Find a rep</label>
        <Input id="catalog-query" type="search" value={filters.query} onChange={(event) => onFilter('query', event.target.value)} placeholder="Try arrays, strings, debugging…" />
      </div>
    </div>
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
    </div>
    <div className="catalog-list-heading">
      <h2>{filters.query.trim() ? 'Search results' : 'All exercises'}</h2>
      <span aria-live="polite">{visibleReps.length} {visibleReps.length === 1 ? 'rep' : 'reps'}</span>
    </div>
    <div className="catalog-list" role="region" aria-label="Exercise list" tabIndex={0}>{visibleReps.length ? visibleReps.map((item) => <button className="rep-list-row" type="button" key={item.id} onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => openRep(item.id)}>
        <span className="rep-list-index">{String(reps.indexOf(item) + 1).padStart(2, '0')}</span>
        <span className="rep-list-name">
          <strong>{item.title}</strong>
          <small>{item.category} · {formatLabels[item.format ?? 'algorithm']}{dueIds.has(item.id) ? ' · Review due' : ''}</small>
        </span>
        <span className={`rep-list-status ${repStatus(item).toLowerCase().replace(' ', '-')}`}>{repStatus(item)}</span>
        <span className="rep-list-arrow" aria-hidden="true">→</span>
      </button>) : <p className="catalog-empty">No reps match these filters. Clear filters or try a shorter search.</p>}</div>
  </main>
}
