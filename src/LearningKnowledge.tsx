import { reducedMotion } from './ui-motion'
import { Button } from './Button'
import { Icon } from './Icon'
import { Input } from './Input'
import { LearningLesson } from './LearningLesson'
import { useMemo, useRef } from 'react'
import { skills, knowledgeGroups } from './knowledge'
import type { FluencyState } from './fluency'
import type { PortableRecord } from './portability'
import { useSessionPreference } from './useSessionPreference'
import { EmptyState } from './Layout'
import { goToView } from './ui-navigation'

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
function skillSearchText(skill: (typeof skills)[number]) {
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
  const [indexOpen, setIndexOpen] = useSessionPreference<'open' | 'closed'>(
    'lesson-index',
    matchMedia('(min-width: 901px)').matches ? 'open' : 'closed',
  )
  // Every word must appear; lessons whose title matches come before lessons that only mention the words.
  const matching = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const found = skills.filter(s => words.every(word => skillSearchText(s).includes(word)))
    const inTitle = (s: (typeof skills)[number]) => words.every(word => s.title.toLowerCase().includes(word))
    return [...found.filter(inTitle), ...found.filter(s => !inTitle(s))]
  }, [query])
  const groups = useMemo(
    () =>
      knowledgeGroups
        .map(group => ({ ...group, lessons: matching.filter(skill => group.skillIds.includes(skill.id)) }))
        .filter(group => group.lessons.length)
        // While searching, the group holding the best match comes first.
        .sort((a, b) => (query.trim() ? matching.indexOf(a.lessons[0]) - matching.indexOf(b.lessons[0]) : 0)),
    [matching, query],
  )
  function selectSkill(id: string) {
    onSkill(id)
    if (matchMedia('(max-width: 900px)').matches) setIndexOpen('closed')
    requestAnimationFrame(() => {
      const lesson = lessonRef.current
      lesson?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' })
      lesson?.focus({ preventScroll: true })
    })
  }
  // Bookmarks are a shelf above the topics rather than a filter, so keeping one never hides the rest.
  const bookmarks = query.trim() ? [] : skills.filter(skill => state.bookmarks.includes(skill.id))
  const lessonButton = (skill: (typeof skills)[number]) => {
    // A lesson whose predictions are all checked shows a check, with the words for assistive technology.
    const checked = skill.questions.length > 0 && skill.questions.every(q => state.answers[`${skill.id}:${q.id}`])
    return (
      <Button type="button" key={skill.id} aria-current={skillId === skill.id ? 'page' : undefined} onClick={() => selectSkill(skill.id)}>
        <strong>{skill.title}</strong>
        {checked && (
          <span className="lesson-checked">
            <Icon name="check" />
            <span className="visually-hidden">Predictions checked</span>
          </span>
        )}
        <Icon name="arrow" still />
      </Button>
    )
  }
  return (
    <div className="knowledge-layout">
      <details
        className="knowledge-browser"
        open={indexOpen === 'open'}
        onToggle={event => setIndexOpen(event.currentTarget.open ? 'open' : 'closed')}
      >
        <summary>
          Browse lessons
          <span aria-live="polite">{groups.reduce((count, group) => count + group.lessons.length, 0)} available</span>
        </summary>
        <aside className="knowledge-index">
          <div className="knowledge-controls">
            <label>
              Find a lesson
              <Input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try arrays or promises" />
            </label>
            <p className="knowledge-more">
              <Button variant="text" onClick={onQuickLessons}>
                Quick lessons
              </Button>
              <Button variant="text" onClick={() => goToView('patterns')}>
                Pattern cards
              </Button>
            </p>
          </div>
          <nav aria-label="Skills">
            {bookmarks.length > 0 && (
              <details className="knowledge-group" open>
                <summary>
                  Bookmarked
                  <span>{bookmarks.length}</span>
                </summary>
                <div className="knowledge-topic-list">{bookmarks.map(lessonButton)}</div>
              </details>
            )}
            {groups.map(group => (
              <details className="knowledge-group" key={group.id} open={Boolean(query.trim()) || group.skillIds.includes(skillId)}>
                <summary>
                  {group.title}
                  <span>{group.lessons.length}</span>
                </summary>
                <div className="knowledge-topic-list">{group.lessons.map(lessonButton)}</div>
              </details>
            ))}
          </nav>
          {!groups.length && (
            <EmptyState
              title="No lessons match."
              action={
                <Button variant="text" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              }
            >
              Try another word, or clear the search to see every lesson.
            </EmptyState>
          )}
        </aside>
      </details>
      <div ref={lessonRef} tabIndex={-1} className="knowledge-reading">
        <LearningLesson
          key={skillId}
          skillId={skillId}
          state={state}
          update={update}
          openRep={openRep}
          onSkill={selectSkill}
          history={history}
        />
      </div>
    </div>
  )
}
