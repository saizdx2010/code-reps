import { Button } from './Button'
import { Icon } from './Icon'
import { Input, Select } from './Input'
import { LearningLesson } from './LearningLesson'
import { useMemo, useRef } from 'react'
import { skills, knowledgeGroups } from './knowledge'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { useSessionPreference } from './useSessionPreference'

type Props = {
  state: FluencyState
  update: (next: FluencyState) => boolean
  history: PortableRecord[]
  openRep: (id: string) => void
  skillId: string
  onSkill: (id: string) => void
  onQuickLessons: () => void
}

const searchText = new Map<string, string>()
function skillSearchText(skill: typeof skills[number]) {
  let text = searchText.get(skill.id)
  if (text === undefined) {
    text = `${skill.title} ${skill.summary} ${skill.sections.map(x => x.body).join(' ')} ${skill.objectives.join(' ')}`.toLowerCase()
    searchText.set(skill.id, text)
  }
  return text
}

/** The Lessons tab: a filterable lesson index beside the selected lesson. */
export function LearningKnowledge({ state, update, history, openRep, skillId, onSkill, onQuickLessons }: Props) {
  const lessonRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useSessionPreference<string>('knowledge-query', '')
  const [bookmarkFilter, setBookmarkFilter] = useSessionPreference<'all' | 'bookmarked'>('knowledge-bookmarks', 'all')
  const bookmarked = bookmarkFilter === 'bookmarked'
  const [topic, setTopic] = useSessionPreference<string>('knowledge-topic', '')
  const [indexOpen, setIndexOpen] = useSessionPreference<'open' | 'closed'>('lesson-index', matchMedia('(min-width: 901px)').matches ? 'open' : 'closed')
  const matching = useMemo(() => {
    const needle = query.toLowerCase()
    return skills.filter(s => (!bookmarked || state.bookmarks.includes(s.id)) && skillSearchText(s).includes(needle))
  }, [query, bookmarked, state.bookmarks])
  const groups = useMemo(() => knowledgeGroups
    .filter(group => !topic || group.id === topic)
    .map(group => ({ ...group, lessons: matching.filter(skill => group.skillIds.includes(skill.id)) }))
    .filter(group => group.lessons.length), [matching, topic])
  function selectSkill(id: string) {
    onSkill(id)
    if (matchMedia('(max-width: 900px)').matches) setIndexOpen('closed')
    requestAnimationFrame(() => {
      const lesson = lessonRef.current
      lesson?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      lesson?.focus({ preventScroll: true })
    })
  }
  function clearFilters() {
    setQuery('')
    setTopic('')
    setBookmarkFilter('all')
  }
  return <div className="knowledge-layout">
    <details className="knowledge-browser" open={indexOpen === 'open'} onToggle={event => setIndexOpen(event.currentTarget.open ? 'open' : 'closed')}>
      <summary>Browse lessons<span aria-live="polite">{groups.reduce((count, group) => count + group.lessons.length, 0)} available</span></summary>
      <aside className="knowledge-index">
        <div className="knowledge-controls">
          <label>Search knowledge<Input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try arrays or promises" /></label>
          <label>Topic<Select value={topic} onChange={e => setTopic(e.target.value)}>
            <option value="">All topics</option>
            {knowledgeGroups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}
          </Select></label>
          <label className="check-label">
            <Input type="checkbox" checked={bookmarked} onChange={e => setBookmarkFilter(e.target.checked ? 'bookmarked' : 'all')} />Bookmarks only
          </label>
          <Button variant="text" onClick={onQuickLessons}>Quick lessons</Button>
        </div>
        <nav aria-label="Skills">{groups.map(group => (
          <details
            className="knowledge-group" key={group.id}
            open={Boolean(query.trim()) || Boolean(topic) || bookmarked || group.skillIds.includes(skillId)}
          >
            <summary>{group.title}<span>{group.lessons.length}</span></summary>
            <div className="knowledge-topic-list">{group.lessons.map(skill => (
              <Button type="button" key={skill.id} aria-current={skillId === skill.id ? 'page' : undefined} onClick={() => selectSkill(skill.id)}>
                <strong>{skill.title}</strong><Icon name="arrow" />
              </Button>
            ))}</div>
          </details>
        ))}</nav>
        {!groups.length && <p>No matching knowledge. Try another term or clear filters.</p>}
        {(query || topic || bookmarked) && <Button variant="text" onClick={clearFilters}>Clear knowledge filters</Button>}
      </aside>
    </details>
    <div ref={lessonRef} tabIndex={-1} className="knowledge-reading">
      <LearningLesson key={skillId} skillId={skillId} state={state} update={update} openRep={openRep} onSkill={selectSkill} history={history} />
    </div>
  </div>
}
