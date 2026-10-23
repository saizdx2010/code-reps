import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { InfoNote, StatusChip } from './Layout'
import { lifeParts, lifeSources, settled, startingBoard } from './life-toy.ts'
import type { LifeResult, LifeSources, LifeStep } from './life-toy.ts'
import { toySession } from './toy-session'
import type { PortableRecord } from './portability'
import { repTitle } from './rep-index.ts'
import { reducedMotion } from './ui-motion'
import './life-toy.css'

/** Play stops by itself after this many generations, so it never runs on unattended. */
const playLimit = 200
const playDelayMs = 250

/**
 * Game of Life, run by the learner's own saved solutions to three reps. Until every part is completed it lists the parts;
 * then the board steps with their nextGeneration, and a selected cell shows what their countNeighbours and nextCell say.
 */
export default function LifeToy({ history, openRep }: { history: PortableRecord[]; openRep: (id: string) => void }) {
  const found = lifeSources(history)
  const missing = lifeParts.filter(part => !found[part.functionName])
  return (
    <article className="hub-panel life-toy" aria-labelledby="life-toy-title">
      <header className="life-toy-head">
        <div>
          <h3 id="life-toy-title">Game of Life</h3>
          <p>
            Runs on your code ·{' '}
            {missing.length ? `${lifeParts.length - missing.length} of ${lifeParts.length} parts built` : 'all parts built'}
          </p>
        </div>
        <StatusChip tone="progress">Toy</StatusChip>
      </header>
      {missing.length ? <Parts found={found} openRep={openRep} /> : <Board sources={found as LifeSources} openRep={openRep} />}
    </article>
  )
}

function Parts({ found, openRep }: { found: ReturnType<typeof lifeSources>; openRep: (id: string) => void }) {
  const next = lifeParts.find(part => !found[part.functionName])!
  return (
    <>
      <p className="life-toy-intro">
        Three short reps build the rules. When all three are complete, this board runs your saved solutions, not ours, and you can draw on
        it and watch it go.
      </p>
      <ol className="life-toy-parts">
        {lifeParts.map(part => (
          <li key={part.id} className={found[part.functionName] ? 'is-built' : undefined}>
            <div>
              <code>{part.functionName}</code>
              <span>{repTitle(part.id)}</span>
            </div>
            <StatusChip tone={found[part.functionName] ? 'success' : 'neutral'}>
              {found[part.functionName] ? 'Built' : 'Not yet'}
            </StatusChip>
          </li>
        ))}
      </ol>
      <Button variant="primary" onClick={() => openRep(next.id)}>
        Build {next.functionName}
        <Icon name="arrow" />
      </Button>
    </>
  )
}

type Failure = { kind: 'differs'; generation: number; cells: [number, number][] } | { kind: 'error'; message: string }

function Board({ sources, openRep }: { sources: LifeSources; openRep: (id: string) => void }) {
  const session = useMemo(
    () => toySession<LifeStep, LifeResult>('life', sources),
    [sources.countNeighbours, sources.nextCell, sources.nextGeneration],
  )
  useEffect(() => () => session.close(), [session])
  const [board, setBoard] = useState(startingBoard)
  const [generation, setGeneration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [focus, setFocus] = useState<[number, number]>([0, 0])
  const [inspected, setInspected] = useState<Extract<LifeResult, { next: string[] }>['inspect'] | null>(null)
  // The boards before the current one (at most two) tell a settled board; refs keep repeated steps on the latest board.
  const trail = useRef<string[][]>([])
  // Clear, Start over, and switching a cell start a new board; a step or answer still running for the old one is dropped.
  const version = useRef(0)
  const current = useRef({ board, generation })
  current.current = { board, generation }
  const cells = useRef<(HTMLButtonElement | null)[]>([])
  const width = board[0]?.length ?? 0
  const marked = new Set(failure?.kind === 'differs' ? failure.cells.map(([r, c]) => `${r},${c}`) : [])

  async function step(): Promise<boolean> {
    const { board: before, generation: count } = current.current
    const started = version.current
    setBusy(true)
    const result = await session.run({ grid: before })
    setBusy(false)
    if (version.current !== started) return false
    if ('error' in result) {
      // A closed session (the toy left the page, or the code changed) ends quietly.
      if (result.error) setFailure({ kind: 'error', message: result.error })
      return false
    }
    const history = [...trail.current, before, result.next].slice(-3)
    trail.current = history.slice(0, -1)
    current.current = { board: result.next, generation: count + 1 }
    setBoard(result.next)
    setGeneration(count + 1)
    setInspected(null)
    if (result.differs.length) {
      setFailure({ kind: 'differs', generation: count + 1, cells: result.differs })
      return false
    }
    setFailure(null)
    return !settled(history)
  }
  function restart(next: string[]) {
    version.current++
    setPlaying(false)
    setFailure(null)
    setInspected(null)
    setGeneration(0)
    trail.current = []
    setBoard(next)
  }

  // Play advances only while the learner has it on, pauses when the tab is hidden, and stops on a settled board.
  useEffect(() => {
    if (!playing || busy) return
    if (generation >= playLimit || document.visibilityState === 'hidden') return setPlaying(false)
    const timer = window.setTimeout(() => {
      void step().then(more => {
        if (!more) setPlaying(false)
      })
    }, playDelayMs)
    return () => window.clearTimeout(timer)
  })
  useEffect(() => {
    const pause = () => document.visibilityState === 'hidden' && setPlaying(false)
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])

  async function stepTen() {
    for (let i = 0; i < 10; i++) if (!(await step())) break
  }
  function toggle(r: number, c: number) {
    version.current++
    setPlaying(false)
    setFailure(null)
    trail.current = []
    setBoard(current => current.map((row, y) => (y === r ? row.slice(0, c) + (row[c] === '#' ? '.' : '#') + row.slice(c + 1) : row)))
  }
  async function inspect(r: number, c: number) {
    const started = version.current
    const result = await session.run({ grid: current.current.board, inspect: [r, c] })
    if (version.current !== started) return
    if ('error' in result) {
      if (result.error) setFailure({ kind: 'error', message: result.error })
    } else setInspected(result.inspect ?? null)
  }
  function move(event: KeyboardEvent, r: number, c: number) {
    const delta = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[event.key]
    if (!delta) return
    event.preventDefault()
    const next: [number, number] = [Math.max(0, Math.min(board.length - 1, r + delta[0])), Math.max(0, Math.min(width - 1, c + delta[1]))]
    setFocus(next)
    cells.current[next[0] * width + next[1]]?.focus()
  }
  const liveCount = board.join('').split('#').length - 1
  const calm = reducedMotion()
  return (
    <div className="life-toy-play">
      <div className="life-toy-field">
        <div className="life-toy-status">
          <strong>
            Generation {generation}
            {busy && !playing && <span className="life-toy-busy"> · running your code…</span>}
          </strong>
          <span>
            your <code>countNeighbours</code> · <code>nextCell</code> · <code>nextGeneration</code>
          </span>
        </div>
        <div
          className="life-board"
          role="grid"
          aria-label={`Board, generation ${generation}, ${liveCount} live cells`}
          aria-rowcount={board.length}
          aria-colcount={width}
        >
          {board.map((row, r) => (
            <div key={r} role="row" className="life-row">
              {Array.from(row, (cell, c) => (
                // A grid cell holds one button; its name carries the state, so no pressed state is added.
                <span key={c} role="gridcell" className="life-slot">
                  <button
                    ref={node => {
                      cells.current[r * width + c] = node
                    }}
                    type="button"
                    tabIndex={focus[0] === r && focus[1] === c ? 0 : -1}
                    aria-label={`Row ${r + 1}, column ${c + 1}, ${cell === '#' ? 'live' : 'dead'}${marked.has(`${r},${c}`) ? ', differs from the rules' : ''}`}
                    className={`life-cell${cell === '#' ? ' is-live' : ''}${marked.has(`${r},${c}`) ? ' is-marked' : ''}`}
                    onClick={() => {
                      setFocus([r, c])
                      toggle(r, c)
                    }}
                    onFocus={() => setFocus([r, c])}
                    onKeyDown={event => {
                      if (event.key.toLowerCase() === 'i' && !event.ctrlKey && !event.metaKey && !event.altKey) {
                        event.preventDefault()
                        void inspect(r, c)
                      } else move(event, r, c)
                    }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="life-toy-side">
        <div className="life-toy-controls">
          <Button onClick={() => void step()} disabled={busy || playing}>
            Step
            <Icon name="arrow" />
          </Button>
          {calm ? (
            <Button variant="primary" onClick={() => void stepTen()} disabled={busy}>
              Step ×10
            </Button>
          ) : (
            <Button variant="primary" aria-pressed={playing} onClick={() => setPlaying(!playing)} disabled={!playing && busy}>
              {playing ? 'Pause' : 'Play'}
              <Icon name="play" />
            </Button>
          )}
          <Button variant="text" onClick={() => void inspect(focus[0], focus[1])} disabled={busy || playing}>
            Ask your code about row {focus[0] + 1}, column {focus[1] + 1}
          </Button>
          <Button variant="text" onClick={() => restart(board.map(row => '.'.repeat(row.length)))}>
            Clear
          </Button>
          <Button variant="text" onClick={() => restart(startingBoard())}>
            Start over
          </Button>
        </div>
        <p className="life-toy-help">
          Click a cell to switch it. With the board focused, arrow keys move, Enter switches a cell, and I asks your code about it.
        </p>
        {inspected && (
          <p className="life-toy-inspect" role="status">
            Row {inspected.position[0] + 1}, column {inspected.position[1] + 1}: your <code>countNeighbours</code> says{' '}
            <strong>{String(inspected.neighbours)}</strong>, and your <code>nextCell</code> says it will be{' '}
            <strong>{inspected.next === true ? 'live' : inspected.next === false ? 'dead' : String(inspected.next)}</strong>.
          </p>
        )}
        {failure && (
          <div className="life-toy-failure" role="alert">
            <Icon name="alert" />
            <div>
              <p>
                {failure.kind === 'differs'
                  ? `Generation ${failure.generation} differs from the rules in ${failure.cells.length} marked ${failure.cells.length === 1 ? 'cell' : 'cells'}. Your checks passed, so this is a case they did not cover.`
                  : failure.message}
              </p>
              <p className="life-toy-actions">
                <Button variant="primary" onClick={() => openRep('life-next-generation')}>
                  Open nextGeneration
                  <Icon name="arrow" />
                </Button>
                {failure.kind === 'differs' && (
                  <Button variant="text" onClick={() => setFailure(null)}>
                    Keep playing
                  </Button>
                )}
              </p>
            </div>
          </div>
        )}
        <InfoNote label="What the toy shows">
          The toy runs your latest completed solutions in the practice worker and compares each generation with the rules. It is play, not
          evidence: nothing here is saved or changes a skill.
        </InfoNote>
      </div>
    </div>
  )
}
