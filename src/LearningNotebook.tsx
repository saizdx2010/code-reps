import { formatDate } from './ui-copy.ts'
import { Button } from './Button'
import { Icon } from './Icon'
import { Input, Select, Textarea } from './Input'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { skills, skillById } from './knowledge'
import type { FluencyState, LearningNote } from './fluency'
import { repIndex as reps } from './catalog-index'
import { repTitle } from './rep-index.ts'

type Props = { state: FluencyState; update: (next: FluencyState) => boolean }

const blankNote = (): LearningNote => ({ id: crypto.randomUUID(), title: '', body: '', skillId: '', repId: '', kind: 'note', updatedAt: new Date().toISOString() })

/** The Journal notebook: searchable entries and one open draft that survives reloads. */
export function LearningNotebook({ state, update }: Props) {
  const [query, setQuery] = useState('')
  const [editing, setEditingState] = useState<LearningNote | null>(state.noteDraft ?? null)
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  function setEditing(next: LearningNote | null) {
    setEditingState(next)
    update({ ...state, noteDraft: next ?? undefined })
  }
  function openEntry(next: LearningNote) {
    setMessage('')
    setEditing(next)
  }
  const cancel = () => setEditing(null)
  function save(event: FormEvent) {
    event.preventDefault()
    if (!editing?.title.trim()) return
    const saved = { ...editing, title: editing.title.trim(), updatedAt: new Date().toISOString() }
    if (update({ ...state, noteDraft: undefined, notes: [saved, ...state.notes.filter(n => n.id !== editing.id)] })) {
      setEditingState(null)
      setMessage('Entry saved.')
    } else setMessage('Entry could not be saved. Keep this form open and retry.')
  }
  const newNote = () => openEntry(blankNote())
  const visible = state.notes.filter(note => (
    `${note.title} ${note.body} ${note.kind} ${skillById(note.skillId)?.title ?? ''}`.toLowerCase().includes(query.toLowerCase())
  ))
  return <>
    <div className="hub-heading">
      <div><p>Keep recurring mistakes, questions, and ideas next to the skill or attempt they concern.</p></div>
      <Button variant="primary" type="button" onClick={newNote}>New entry</Button>
    </div>
    <label>Search notes<Input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a concept or mistake" /></label>
    {editing && <NoteForm editing={editing} isNew={!state.notes.some(n => n.id === editing.id)} onChange={setEditing} onSubmit={save} onCancel={cancel} />}
    {message && <p className="hub-message feedback-note" data-state={message === 'Entry saved.' ? 'success' : 'error'} role="status">
      <Icon name={message === 'Entry saved.' ? 'check' : 'alert'} />{message}
    </p>}
    <div className="hub-cards">{visible.map(note => <article className="hub-panel" key={note.id}>
      <span className="home-label">{note.kind}</span>
      <h3>{note.title}</h3>
      <p className="note-body">{note.body}</p>
      <p className="utility-note">{skillById(note.skillId)?.title} {note.repId && ` · ${repTitle(note.repId)}`} · {formatDate(note.updatedAt)}</p>
      <div className="hub-actions">
        <Button type="button" onClick={() => openEntry(note)}>Edit</Button>
        {confirm === note.id
          ? <>
            <Button variant="danger" type="button" onClick={() => { update({ ...state, notes: state.notes.filter(n => n.id !== note.id) }); setConfirm('') }}>
              Confirm delete
            </Button>
            <Button type="button" onClick={() => setConfirm('')}>Keep entry</Button>
          </>
          : <Button type="button" onClick={() => setConfirm(note.id)}>Delete…</Button>}
      </div>
    </article>)}</div>
    {!visible.length && <div className="hub-empty">
      <span className="home-label">{query ? 'No matches' : 'Your notebook'}</span>
      <h3>{query ? 'Try another search.' : 'Make your next attempt useful.'}</h3>
      <p>{query ? 'No matching entries.' : 'Your notebook is empty. Save an idea or mistake after your next attempt.'}</p>
      {!query && <Button variant="primary" onClick={newNote}>Write your first entry</Button>}
    </div>}
  </>
}

type FormProps = {
  editing: LearningNote
  isNew: boolean
  onChange: (next: LearningNote) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
}

function NoteForm({ editing, isNew, onChange, onSubmit, onCancel }: FormProps) {
  return <form className="hub-panel" onSubmit={onSubmit}>
    <h3>{isNew ? 'New entry' : 'Edit entry'}</h3>
    <label>Title<Input required maxLength={120} value={editing.title} onChange={e => onChange({ ...editing, title: e.target.value })} /></label>
    <div className="hub-form-row">
      <label>Kind<Select value={editing.kind} onChange={e => onChange({ ...editing, kind: e.target.value as LearningNote['kind'] })}>
        <option value="note">Note</option><option value="mistake">Mistake</option><option value="question">Question</option>
      </Select></label>
      <label>Skill<Select value={editing.skillId} onChange={e => onChange({ ...editing, skillId: e.target.value })}>
        <option value="">General</option>
        {skills.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
      </Select></label>
      <label>Exercise<Select value={editing.repId} onChange={e => onChange({ ...editing, repId: e.target.value })}>
        <option value="">No exercise</option>
        {reps.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
      </Select></label>
    </div>
    <label>What you learned<Textarea maxLength={20_000} rows={7} value={editing.body} onChange={e => onChange({ ...editing, body: e.target.value })} /></label>
    <div className="hub-actions">
      <Button variant="primary" type="submit">Save entry</Button>
      <Button type="button" onClick={onCancel}>Cancel</Button>
    </div>
  </form>
}
