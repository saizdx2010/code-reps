import { useState } from 'react'
import { Button } from './Button'
import type { RepTrace, TraceStructure } from './rep-depth'

function describe(structure: TraceStructure) {
  if (structure.kind === 'map') return `Map entries: ${structure.entries.map(([key, value]) => `${key}: ${value}`).join(', ') || 'empty'}.`
  const values = structure.values.map((value, index) => `${index}: ${value}`).join(', ') || 'empty'
  if (structure.kind === 'stack') return `Stack, bottom to top: ${values}.`
  return `Array: ${values}. Pointers: ${Object.entries(structure.pointers ?? {}).map(([name, index]) => `${name} at index ${index}`).join(', ') || 'none'}. Dimmed indices: ${structure.dimmed?.join(', ') || 'none'}.`
}

function Structure({ structure }: { structure: TraceStructure }) {
  const cells = structure.kind === 'map' ? structure.entries.map(([key, value]) => `${key}: ${value}`) : structure.values.map(String)
  const vertical = structure.kind !== 'array'
  const pointers = structure.kind === 'array' ? Object.entries(structure.pointers ?? {}) : []
  const width = vertical ? 260 : Math.max(100, cells.length * 90)
  const height = vertical ? Math.max(60, cells.length * 54) : 100 + pointers.length * 28
  return <div className="trace-structure"><svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    {cells.map((value, index) => {
      const x = vertical ? 5 : index * 90 + 5
      const y = vertical ? (structure.kind === 'stack' ? cells.length - index - 1 : index) * 54 + 5 : 22
      const dimmed = structure.kind === 'array' && structure.dimmed?.includes(index)
      return <g key={index} className={dimmed ? 'trace-dimmed' : undefined}>
        <rect x={x} y={y} width={vertical ? 250 : 80} height={40} rx={8} />
        <text x={x + (vertical ? 125 : 40)} y={y + 25}>{value}</text>
        {!vertical && <text x={x + 40} y={14} className="trace-index">{index}</text>}
      </g>
    })}
    {pointers.map(([name, index], row) => <g key={name} className="trace-pointer" transform={`translate(${index * 90 + 45}, ${70 + row * 28})`}><path d="M 0 0 L -6 10 L 6 10 Z" /><text y={25}>{name}</text></g>)}
    {!cells.length && <text x={width / 2} y={30}>Empty {structure.kind}</text>}
  </svg><p className="sr-only">{describe(structure)}</p></div>
}

/** Authored snapshots for post-solve comparison, not a live code execution trace. */
export function TraceViewer({ trace }: { trace: RepTrace }) {
  const [index, setIndex] = useState(0)
  const step = trace.steps[index]
  const previous = trace.steps[index - 1]
  const move = (delta: number) => setIndex(current => Math.max(0, Math.min(trace.steps.length - 1, current + delta)))
  return <section className="trace-viewer" aria-label="Step trace" tabIndex={0} onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      event.stopPropagation()
      move(event.key === 'ArrowRight' ? 1 : -1)
    }
  }}>
    <h4>Step trace</h4><p className="utility-note">Authored reference snapshots</p><p><strong>Input:</strong> <code>{trace.input}</code></p>
    <div className="trace-panes"><div className="trace-code" role="list" aria-label="Trace code">
      {trace.code.map((line, lineIndex) => <div role="listitem" key={lineIndex} className={lineIndex === step.line ? 'trace-current' : undefined} aria-current={lineIndex === step.line ? 'step' : undefined}><span className="trace-line-number" aria-hidden="true">{lineIndex + 1}</span><code>{line || ' '}</code>{lineIndex === step.line && <span className="sr-only"> Current line</span>}</div>)}
    </div><div>{step.structure && <Structure structure={step.structure} />}<table className="trace-vars"><caption>Variables</caption><thead><tr><th scope="col">Name</th><th scope="col">Value</th></tr></thead><tbody>{Object.entries(step.vars).map(([name, value]) => {
      const changed = Boolean(previous) && (!Object.hasOwn(previous.vars, name) || previous.vars[name] !== value)
      return <tr key={name} className={changed ? 'trace-changed' : undefined}><th scope="row">{name}</th><td><code>{String(value)}</code>{changed && <span className="trace-change-label"> changed</span>}</td></tr>
    })}</tbody></table></div></div>
    <p className="trace-note" aria-live="polite" aria-atomic="true">Step {index + 1} of {trace.steps.length}: {step.note}</p>
    <div className="trace-controls"><Button disabled={index === 0} onClick={() => move(-1)}>Prev</Button><div className="trace-dots" aria-label="Trace steps">{trace.steps.map((_, dot) => <Button key={dot} variant="text" aria-label={`Go to step ${dot + 1}`} aria-current={dot === index ? 'step' : undefined} onClick={() => setIndex(dot)}><span aria-hidden="true" /></Button>)}</div><Button disabled={index === trace.steps.length - 1} onClick={() => move(1)}>Next</Button></div>
    <p className="utility-note">Use Left and Right arrow keys while focused here.</p>
  </section>
}
