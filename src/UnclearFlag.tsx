import './unclear-flag.css'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { Textarea } from './Input'
import { skillSummariesForRep } from './skill-index.ts'
import { formatDate } from './ui-copy.ts'
import { goToView } from './ui-navigation.ts'
import { unclearNote, unclearNotesFor, unclearParts } from './unclear-notes.ts'
import type { UnclearPart } from './unclear-notes.ts'
import type { useFluency } from './useFluency'

type Props = { repId: string; repTitle: string; fluency: ReturnType<typeof useFluency> }

/** A quiet way to say a rep's wording got in the way, saved as a Notebook question for the next content pass. */
export function UnclearFlag({ repId, repTitle, fluency }: Props) {
  const [open, setOpen] = useState(false)
  const [parts, setParts] = useState<UnclearPart[]>([])
  const [detail, setDetail] = useState('')
  const [message, setMessage] = useState('')
  const fieldId = useId()
  const flagged = unclearNotesFor(fluency.state.notes, repId)
  const toggle = (part: UnclearPart) => setParts(parts.includes(part) ? parts.filter(item => item !== part) : [...parts, part])

  function save(event: FormEvent) {
    event.preventDefault()
    const note = unclearNote({
      id: crypto.randomUUID(),
      repId,
      repTitle,
      skillId: skillSummariesForRep(repId)[0]?.id ?? '',
      parts,
      detail,
      now: Date.now(),
    })
    if (!note) return setMessage('Choose a part or write a few words first.')
    if (!fluency.update({ ...fluency.state, notes: [note, ...fluency.state.notes] }))
      return setMessage('This could not be saved. Your words are still here; try again.')
    setParts([])
    setDetail('')
    setOpen(false)
    setMessage('Saved to your Notebook. Carry on with the rep.')
  }

  return (
    <div className="unclear-flag">
      <Button variant="text" aria-expanded={open} onClick={() => setOpen(!open)}>
        Something unclear here?
        <Icon name="chevron" />
      </Button>
      {open && (
        <form onSubmit={save} aria-label="Something unclear in this rep">
          <p className="unclear-flag-intro">Note what got in the way. It goes to your Notebook so this rep can be improved.</p>
          <div className="choice-chips" role="group" aria-label="Which part">
            {unclearParts.map(part => (
              <button key={part} type="button" aria-pressed={parts.includes(part)} onClick={() => toggle(part)}>
                {part}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor={fieldId}>
            What was unclear? <span className="unclear-flag-optional">(optional)</span>
          </label>
          <Textarea
            id={fieldId}
            rows={3}
            value={detail}
            maxLength={2000}
            onChange={event => setDetail(event.target.value)}
            placeholder="For example: the brief doesn't say what to return for an empty list."
          />
          <div className="unclear-flag-actions">
            <Button type="submit">Save to Notebook</Button>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <p className="unclear-flag-status" role="status">
        {message ||
          (flagged.length > 0 && (
            <>
              You flagged this rep {flagged.length === 1 ? 'once' : `${flagged.length} times`}, last on {formatDate(flagged[0].updatedAt)}.{' '}
              <Button variant="text" onClick={() => goToView('notebook')}>
                Open the Notebook
              </Button>
            </>
          ))}
      </p>
    </div>
  )
}
