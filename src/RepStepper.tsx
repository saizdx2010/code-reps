import { repIndex } from './catalog-index'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { repContext } from './rep-context'
import type { RepOrigin } from './rep-origin'
import { statusTone } from './ui-status'
import { closeOnAction, closeOnEscape } from './menu-close'
import './rep-stepper.css'

/** Previous and next through the list the rep came from, with the position opening a switcher for the whole list. */
export default function RepStepper({
  repId,
  origin,
  goalPathId,
  repStatus,
  openRep,
}: {
  repId: string
  origin: RepOrigin
  goalPathId: string
  repStatus: (id: string) => string
  openRep: (id: string) => void
}) {
  const context = repContext(origin, repId, goalPathId)
  const index = context.repIds.indexOf(repId)
  if (index < 0 || context.repIds.length < 2) return null
  const title = (id: string) => repIndex.find(item => item.id === id)?.title ?? id
  const previous = context.repIds[index - 1]
  const next = context.repIds[index + 1]
  return (
    <div className="rep-stepper" role="group" aria-label={`${context.label}: rep ${index + 1} of ${context.repIds.length}`}>
      <button
        type="button"
        className="rep-stepper-step"
        disabled={!previous}
        aria-label={previous ? `Previous: ${title(previous)}` : 'No previous rep'}
        onClick={() => previous && openRep(previous)}
      >
        <Icon name="left" />
      </button>
      <details
        className="rep-switcher"
        onClick={closeOnAction}
        onKeyDown={closeOnEscape}
        // A long list opens on the current rep rather than its first.
        onToggle={event =>
          event.currentTarget.open && event.currentTarget.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest' })
        }
      >
        <summary aria-label={`Rep ${index + 1} of ${context.repIds.length} in ${context.label}. Choose another rep`}>
          {index + 1}
          <span aria-hidden="true">/</span>
          {context.repIds.length}
        </summary>
        <div>
          <strong className="rep-switcher-label">{context.label}</strong>
          <ol>
            {context.repIds.map(id => {
              const status = repStatus(id)
              return (
                <li key={id}>
                  <button type="button" aria-current={id === repId ? 'true' : undefined} onClick={() => id !== repId && openRep(id)}>
                    <span>{title(id)}</span>
                    {status !== 'Not started' && <StatusChip tone={statusTone(status)}>{status}</StatusChip>}
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </details>
      <button
        type="button"
        className="rep-stepper-step"
        disabled={!next}
        aria-label={next ? `Next: ${title(next)}` : 'No next rep'}
        onClick={() => next && openRep(next)}
      >
        <Icon name="right" />
      </button>
    </div>
  )
}
