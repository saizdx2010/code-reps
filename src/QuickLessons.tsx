import { coreLessons } from './ai-era-reps'
import { repIndex as reps } from './catalog-index'
import { foundations } from './foundations'
import { InlineCode } from './InlineCode'
import { PageHeader } from './Layout'
import { useGlossary } from './useGlossary'
import { plural } from './ui-copy.ts'

type Lesson = { repId: string; title: string; explanation: string; example: string; tip: string }

const problemSkills: { name: string; summary: string; matches: (category: string) => boolean }[] = [
  { name: 'Arrays', summary: 'Visit values in order, count them, and decide what to keep.', matches: c => c.includes('Arrays') },
  { name: 'Maps & sets', summary: 'Use keys for counts and sets to remember what you have seen.', matches: c => /maps|sets/i.test(c) },
  { name: 'Strings', summary: 'Work through text one character or word at a time.', matches: c => c.includes('Strings') },
  { name: 'Stacks', summary: 'Track the most recent unmatched opening item.', matches: c => c.includes('Stacks') },
]

/** The quick-lessons page. It owns the short lesson text and the glossary, so neither ships with startup. */
export default function QuickLessons({ openRep, onBrowse }: { openRep: (id: string) => void; onBrowse: () => void }) {
  const glossary = useGlossary()
  return (
    <main className="learn-main">
      <PageHeader
        eyebrow="Lessons" title="Quick lessons"
        description="Short introductions before your first rep. Full lessons have interactive predictions and learning tools."
        actions={<button type="button" className="text-button" onClick={onBrowse}>Browse lessons</button>}
      />
      <details className="learn-section" open>
        <summary><h2 id="foundations-heading">TypeScript foundations</h2></summary>
        <p className="section-intro">
          Start here if variables, types, and objects are new to you. Read an example, then try its short rep.
        </p>
        <LessonList lessons={foundations} openRep={openRep} />
      </details>
      <details className="learn-section">
        <summary><h2 id="core-lessons-heading">Reading, building, and interviews</h2></summary>
        <p className="section-intro">Read a concept, try a focused rep, and explain how you checked your result.</p>
        <LessonList lessons={coreLessons} openRep={openRep} />
      </details>
      <details className="learn-section">
        <summary><h2>Problem-solving skills</h2></summary>
        <div className="skill-list">{problemSkills.map(skill => {
          const related = reps.filter(item => skill.matches(item.category))
          return <article className="skill-card" key={skill.name}>
            <h3>{skill.name}</h3>
            <p>{skill.summary}</p>
            <span>{related.length} {plural(related.length, 'rep')}</span>
            <button className="text-button" type="button" onClick={() => openRep(related[0].id)}>Try {related[0].title}</button>
          </article>
        })}</div>
      </details>
      <details className="learn-section">
        <summary><h2>Glossary</h2></summary>
        {glossary.status === 'loading' && <p role="status">Loading the glossary…</p>}
        {glossary.status === 'error' && <div role="alert">
          <p>The glossary could not load.</p>
          <button type="button" className="text-button" onClick={glossary.retry}>Retry</button>
        </div>}
        <dl className="glossary-list">{glossary.status === 'ready' && glossary.terms.map(item => (
          <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>
        ))}</dl>
      </details>
    </main>
  )
}

/** A numbered list of short lessons, each ending with its rep. */
function LessonList({ lessons, openRep }: { lessons: readonly Lesson[]; openRep: (id: string) => void }) {
  return <div className="foundation-list">{lessons.map((lesson, index) => <details className="foundation-lesson" key={lesson.repId}>
    <summary>
      <span className="foundation-number">{String(index + 1).padStart(2, '0')}</span>
      <h3>{lesson.title}</h3>
      <span className="disclosure-arrow" aria-hidden="true" />
    </summary>
    <div className="foundation-content">
      <p><InlineCode text={lesson.explanation} /></p>
      <pre><code>{lesson.example}</code></pre>
      <p className="foundation-tip"><InlineCode text={lesson.tip} /></p>
      <button className="text-button" type="button" onClick={() => openRep(lesson.repId)}>Try the rep</button>
    </div>
  </details>)}</div>
}
