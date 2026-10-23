import { formatDate } from './ui-copy.ts'
import { Button } from './Button'
import { Icon } from './Icon'
import { EmptyState } from './Layout'
import { Input, Select, Textarea } from './Input'
import { useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import { skills, skillById } from './knowledge'
import type { FluencyState, LearningNote } from './fluency'
import { repIndex as reps } from './catalog-index'
import { repTitle } from './rep-index.ts'

type Props = { state: FluencyState; update: (next: FluencyState) => boolean }

const blankNote = (): LearningNote => ({
  id: crypto.randomUUID(),
  title: '',
  body: '',
  skillId: '',
  repId: '',
  kind: 'note',
  updatedAt: new Date().toISOString(),
})

/** Whether replacing the open entry would lose writing the learner has not saved. */
function hasUnsavedChanges(draft: LearningNote | null, notes: LearningNote[]) {
  if (!draft) return false
  const saved = notes.find(note => note.id === draft.id)
  if (!saved) return Boolean(draft.title.trim() || draft.body.trim() || draft.skillId || draft.repId || draft.kind !== 'note')
  return (
    draft.title !== saved.title ||
    draft.body !== saved.body ||
    draft.kind !== saved.kind ||
    draft.skillId !== saved.skillId ||
    draft.repId !== saved.repId
  )
}

/** The Journal notebook: searchable entries and one open draft that survives reloads. */
export function LearningNotebook({ state, update }: Props) {
  const [query, setQuery] = useState('')
  const [editing, setEditingState] = useState<LearningNote | null>(state.noteDraft ?? null)
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  // An entry waiting to replace an open draft that has unsaved writing.
  const [replacement, setReplacement] = useState<LearningNote | null>(null)
  const form = useRef<HTMLFormElement>(null)
  function setEditing(next: LearningNote | null) {
    setEditingState(next)
    update({ ...state, noteDraft: next ?? undefined })
  }
  function openEntry(next: LearningNote) {
    setMessage('')
    if (hasUnsavedChanges(editing, state.notes)) return setReplacement(next)
    setReplacement(null)
    setEditing(next)
  }
  function cancel() {
    setReplacement(null)
    setEditing(null)
  }
  function discardDraft() {
    if (replacement) setEditing(replacement)
    setReplacement(null)
  }
  function keepDraft() {
    setReplacement(null)
    form.current?.querySelector('input')?.focus()
  }
  function save(event: FormEvent) {
    event.preventDefault()
    if (!editing?.title.trim()) return
    const saved = { ...editing, title: editing.title.trim(), updatedAt: new Date().toISOString() }
    if (update({ ...state, noteDraft: undefined, notes: [saved, ...state.notes.filter(n => n.id !== editing.id)] })) {
      setEditingState(null)
      setReplacement(null)
      setMessage('Entry saved.')
    } else setMessage('Entry could not be saved. Keep this form open and retry.')
  }
  const newNote = () => openEntry(blankNote())
  const visible = state.notes.filter(note =>
    `${note.title} ${note.body} ${note.kind} ${skillById(note.skillId)?.title ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  )
  // An empty notebook is one empty state with one action; search and the header button arrive with the first entry.
  const empty = state.notes.length === 0
  return (
    <>
      {!empty && (
        <div className="hub-heading notebook-heading">
          <label>
            Search notes
            <Input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a concept or mistake" />
          </label>
          <Button variant="primary" type="button" onClick={newNote}>
            New entry
          </Button>
        </div>
      )}
      {replacement && editing && (
        <div className="delete-confirm" role="group" aria-labelledby="notebook-unsaved">
          <p id="notebook-unsaved">Your open entry has unsaved changes. Discard them and open another entry?</p>
          <Button variant="danger" type="button" onClick={discardDraft}>
            Discard changes
          </Button>
          <Button type="button" autoFocus onClick={keepDraft}>
            Keep editing
          </Button>
        </div>
      )}
      {editing && (
        <NoteForm
          form={form}
          editing={editing}
          isNew={!state.notes.some(n => n.id === editing.id)}
          onChange={setEditing}
          onSubmit={save}
          onCancel={cancel}
        />
      )}
      {message && (
        <p className="hub-message feedback-note" data-state={message === 'Entry saved.' ? 'success' : 'error'} role="status">
          <Icon name={message === 'Entry saved.' ? 'check' : 'alert'} />
          {message}
        </p>
      )}
      {visible.length > 0 && (
        <div className="hub-cards">
          {visible.map(note => (
            <article className="hub-panel" key={note.id}>
              <span className="home-label">{note.kind}</span>
              <h3>{note.title}</h3>
              <p className="note-body">{note.body}</p>
              <p className="utility-note">
                {skillById(note.skillId)?.title} {note.repId && ` · ${repTitle(note.repId)}`} · {formatDate(note.updatedAt)}
              </p>
              <div className="hub-actions">
                <Button type="button" onClick={() => openEntry(note)}>
                  Edit
                </Button>
                {confirm === note.id ? (
                  <>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => {
                        update({ ...state, notes: state.notes.filter(n => n.id !== note.id) })
                        setConfirm('')
                      }}
                    >
                      Confirm delete
                    </Button>
                    <Button type="button" onClick={() => setConfirm('')}>
                      Keep entry
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setConfirm(note.id)}>
                    Delete…
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {!visible.length &&
        (query ? (
          <EmptyState
            title="No entries match this search."
            action={
              <Button variant="text" onClick={() => setQuery('')}>
                Clear search
              </Button>
            }
          >
            Try another concept or mistake.
          </EmptyState>
        ) : (
          !editing && (
            <EmptyState
              title="No notebook entries yet."
              action={
                <Button variant="primary" type="button" onClick={newNote}>
                  New entry
                </Button>
              }
            >
              Keep recurring mistakes, questions, and ideas next to the skill or attempt they concern.
            </EmptyState>
          )
        ))}
    </>
  )
}

type FormProps = {
  form: RefObject<HTMLFormElement | null>
  editing: LearningNote
  isNew: boolean
  onChange: (next: LearningNote) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
}

function NoteForm({ form, editing, isNew, onChange, onSubmit, onCancel }: FormProps) {
  return (
    <form ref={form} className="hub-panel" onSubmit={onSubmit}>
      <h3>{isNew ? 'New entry' : 'Edit entry'}</h3>
      <label>
        Title
        <Input required maxLength={120} value={editing.title} onChange={e => onChange({ ...editing, title: e.target.value })} />
      </label>
      <div className="hub-form-row">
        <label>
          Kind
          <Select value={editing.kind} onChange={e => onChange({ ...editing, kind: e.target.value as LearningNote['kind'] })}>
            <option value="note">Note</option>
            <option value="mistake">Mistake</option>
            <option value="question">Question</option>
          </Select>
        </label>
        <label>
          Skill
          <Select value={editing.skillId} onChange={e => onChange({ ...editing, skillId: e.target.value })}>
            <option value="">General</option>
            {skills.map(s => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </Select>
        </label>
        <label>
          Exercise
          <Select value={editing.repId} onChange={e => onChange({ ...editing, repId: e.target.value })}>
            <option value="">No exercise</option>
            {reps.map(r => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <label>
        What you learned
        <Textarea maxLength={20_000} rows={7} value={editing.body} onChange={e => onChange({ ...editing, body: e.target.value })} />
      </label>
      <div className="hub-actions">
        <Button variant="primary" type="submit">
          Save entry
        </Button>
        <Button type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
