import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './break-it.css'
import type { Attempt } from './attempt-store'
import { caughtBugs, describeInput, followsRules, formatTries, maxTries, readInput, readTries, readTriesValue } from './break-it.ts'
import type { BreakTry } from './break-it.ts'
import { Button } from './Button'
import { repIndex } from './catalog-index'
import { startCheckRun } from './check-run'
import { Icon } from './Icon'
import { Input, Textarea } from './Input'
import { StatusChip } from './Layout'
import { takeCheckWorker, warmCheckWorker } from './practice-worker'
import type { Rep } from './rep-types'
import type { TestResult } from './runner.types'

// The Break it desk, loaded with the first hunt opened (src/App.tsx), in place of the editor, checks drawer, and run bar.
// It shows the read-only suspect, takes one input at a time, and keeps the log of tries, which is the attempt's code text
// (src/break-it.ts). Each try sends the whole table to a fresh practice worker, which reruns every try and returns the
// checks' verdict; App reads that verdict for completion as it reads any check run.

type Props = {
  rep: Rep
  attempt: Attempt
  /** Saves a field of the open attempt without clearing the verdict this desk just reported. */
  save: <K extends keyof Attempt>(key: K, value: Attempt[K]) => void
  /** Reports the checks' verdict for the saved tries, as a check run would. */
  onResults: (results: TestResult[]) => void
  onReveal: (section: string) => void
}
type Refusal = { field: number; reason: string }
/** A try added in this visit, so only it slides in, strikes its value, and fills its meter segment. */
type Fresh = { n: number; newly: string[] }

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
const sameInput = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((value, index) => value === b[index])

/** The Solve section of a hunt. Until the rep's content arrives it holds App's loading or retry notice. */
export default function BreakIt({ rep, notice, ...props }: Omit<Props, 'rep'> & { rep?: Rep; notice: ReactNode }) {
  return (
    <section id="solution-section" tabIndex={-1} className="panel code-panel">
      {rep?.breakIt ? <Hunt rep={rep} {...props} /> : notice}
    </section>
  )
}

function Hunt({ rep, attempt, save, onResults, onReveal }: Props) {
  const task = rep.breakIt!
  const tries = readTries(attempt.code)
  const caught = tries ? caughtBugs(task, tries) : []
  const remaining = task.bugs.length - caught.length
  const [fields, setFields] = useState(() => task.params.map(() => ''))
  const [refusal, setRefusal] = useState<Refusal | null>(null)
  const [message, setMessage] = useState('')
  const [problem, setProblem] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [fresh, setFresh] = useState<Fresh | null>(null)
  // The try being run and the saved text it was built on. A reply for older text is stale and dropped.
  const [pending, setPending] = useState<{ input: number[]; base: string } | null>(null)
  const [verifying, setVerifying] = useState(() => Boolean(tries?.length))
  const cancelRun = useRef<(() => void) | null>(null)
  const latest = useRef(attempt)
  const firstField = useRef<HTMLInputElement>(null)
  useLayoutEffect(() => {
    latest.current = attempt
  })
  const running = pending && pending.base === attempt.code ? pending : null
  const source = repIndex.find(item => item.id === rep.id)?.source ?? ''

  /** Sends the inputs to a fresh worker, which reruns every try. Only the newest run may report, and only for unchanged text. */
  function run(inputs: number[][], base: string, done: (next: BreakTry[], results: TestResult[]) => void) {
    cancelRun.current?.()
    const table = formatTries(inputs.map(input => ({ input, suspect: '', contract: '', caught: [] })))
    let dispose: (() => void) | undefined
    const finish = () => {
      if (cancelRun.current === dispose) cancelRun.current = null
      // Each run uses its worker once; the next try gets a warm one.
      warmCheckWorker(rep.id, source)
    }
    dispose = startCheckRun(table, rep.id, {
      createWorker: takeCheckWorker,
      source,
      schedule: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
      clearTimer: id => window.clearTimeout(id),
      onResults: (results, reply) => {
        finish()
        const next = readTriesValue(reply.tries)
        if (latest.current.code !== base) return
        if (!next || next.length !== inputs.length)
          return fail('The tries came back unreadable. Your saved tries are unchanged; try again.')
        setProblem('')
        done(next, results)
      },
      onError: message => {
        finish()
        if (latest.current.code === base) fail(message)
      },
    })
    // A run that already reported (it could not start) is disposed, so cancelling it again does nothing.
    cancelRun.current = dispose
  }
  function fail(message: string) {
    setPending(null)
    setVerifying(false)
    setProblem(message)
  }

  // Saved tries are checked again when the hunt opens, so completion rests on this visit's worker, not on saved text.
  function verify() {
    const saved = readTries(latest.current.code)
    const base = latest.current.code
    if (!saved?.length || base === undefined) return setVerifying(false)
    setVerifying(true)
    run(
      saved.map(item => item.input),
      base,
      (next, results) => {
        setVerifying(false)
        // Recomputed answers replace saved ones only on a draft; a completed attempt is never edited by opening it.
        if (formatTries(next) !== base && !latest.current.completedAt) save('code', formatTries(next))
        onResults(results)
      },
    )
  }
  useEffect(() => {
    verify()
    return () => {
      cancelRun.current?.()
      cancelRun.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checks the saved tries once per opened hunt.
  }, [])
  // A reset (or another change to the saved tries) makes a running try stale: stop it, so nothing is added.
  useEffect(() => {
    if (pending && pending.base !== attempt.code) {
      cancelRun.current?.()
      cancelRun.current = null
    }
  }, [attempt.code, pending])

  function tryInput(event: FormEvent) {
    event.preventDefault()
    if (running || !tries) return
    const reading = readInput(task, fields)
    setMessage('')
    if ('field' in reading) {
      setRefusal(reading)
      document.getElementById(`break-${task.params[reading.field].name}`)?.focus()
      return
    }
    setRefusal(null)
    const repeat = tries.findIndex(item => sameInput(item.input, reading.input))
    if (repeat >= 0) return setMessage(`You already tried ${describeInput(task, reading.input)}: it is try #${repeat + 1}.`)
    if (tries.length >= maxTries) return setMessage(`This hunt keeps up to ${maxTries} tries. Reset the rep to start a new table.`)
    const base = attempt.code ?? formatTries([])
    setPending({ input: reading.input, base })
    setVerifying(false)
    setProblem('')
    setAnnouncement('')
    run([...tries.map(item => item.input), reading.input], base, (next, results) => {
      const added = next[next.length - 1]
      const before = caughtBugs(task, next.slice(0, -1))
      const newly = added.caught.filter(id => !before.includes(id))
      const total = before.length + newly.length
      save('code', formatTries(next))
      onResults(results)
      setPending(null)
      setFresh({ n: next.length, newly })
      setAnnouncement(
        `Try ${next.length}: suspect ${added.suspect}, contract ${added.contract}. ${
          added.caught.length ? (newly.length ? 'Caught one.' : 'Caught again.') : 'Same answer.'
        } ${total} of ${task.bugs.length} bugs caught.`,
      )
    })
  }

  function stop() {
    cancelRun.current?.()
    cancelRun.current = null
    warmCheckWorker(rep.id, source)
    setPending(null)
    setMessage('Stopped. Nothing was added, and your tries are unchanged.')
  }

  function retry() {
    setProblem('')
    verify()
  }

  if (!tries)
    return (
      <div className="break-desk">
        <div className="break-problem" role="alert">
          <p>Your saved tries could not be read, so they are kept as they are. Start a new table to keep hunting.</p>
          <Button onClick={() => save('code', formatTries([]))}>Start a new table</Button>
        </div>
      </div>
    )

  // The latest catch, for the card's sentence, and whether an earlier try had already caught its bugs.
  const lastCatch = tries.findLastIndex(item => item.caught.length > 0)
  const catchTry = lastCatch >= 0 ? tries[lastCatch] : undefined
  const firstCaughtBy = catchTry ? tries.findIndex(item => item.caught.some(id => catchTry.caught.includes(id))) : -1
  const rows = tries.map((item, index) => ({ item, n: index + 1 })).reverse()
  const freshCatch = fresh && fresh.n === tries.length && fresh.newly.length > 0 ? fresh : null

  return (
    <div className="break-desk">
      <figure className="break-suspect">
        <figcaption className="editor-top">
          <span className="file-tab">
            <span className="ts-icon">TS</span> suspect.ts
          </span>
          <span className="editor-hint">Read only</span>
        </figcaption>
        <pre>
          <code>
            {task.suspect
              .trimEnd()
              .split('\n')
              .map((line, index) => (
                <span key={index} className="break-line">
                  <span className="break-ln" aria-hidden="true">
                    {index + 1}
                  </span>
                  {line}
                </span>
              ))}
          </code>
        </pre>
      </figure>
      <section className="break-hunt" aria-labelledby="break-hunt-title">
        <div className="break-head">
          <h2 id="break-hunt-title">Your move</h2>
          <StatusChip tone={remaining ? 'attention' : 'success'}>
            {remaining ? `${plural(remaining, 'bug')} hidden` : 'All bugs caught'}
          </StatusChip>
        </div>
        <p className="break-lead">One input at a time. Each try runs the suspect and the contract on a fresh copy of it.</p>
        <form className="break-form" onSubmit={tryInput} noValidate>
          {task.params.map((param, index) => (
            <div key={param.name} className="break-field">
              <label htmlFor={`break-${param.name}`}>{param.name}</label>
              <Input
                id={`break-${param.name}`}
                ref={index === 0 ? firstField : undefined}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={fields[index]}
                aria-invalid={refusal?.field === index || undefined}
                aria-describedby={refusal?.field === index ? 'break-refusal' : undefined}
                onChange={event => {
                  const value = event.target.value
                  setFields(current => current.map((text, at) => (at === index ? value : text)))
                  if (refusal?.field === index) setRefusal(null)
                }}
              />
            </div>
          ))}
          {/* Separate keys keep Stop and Try it separate elements: one click on Stop must not also submit the form. */}
          {running ? (
            <Button key="stop" className="stop-checks-button break-stop" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button key="try" type="submit" variant="primary" className="break-try">
              Try it
              <Icon name="play" />
            </Button>
          )}
        </form>
        {refusal && (
          <p id="break-refusal" className="break-refusal" role="alert">
            <Icon name="alert" />
            <span>
              <strong>Not tried.</strong> {refusal.reason}
            </span>
          </p>
        )}
        {message && (
          <p className="break-notice" role="status">
            {message}
          </p>
        )}
        {problem && (
          <div className="break-problem" role="alert">
            <p>{problem}</p>
            <Button onClick={retry}>Check again</Button>
          </div>
        )}
        {verifying && !problem && (
          <p className="break-notice is-loading" role="status">
            Checking your saved tries
          </p>
        )}
        {catchTry && (
          <section className="break-caught" aria-labelledby="break-caught-title">
            <h3 id="break-caught-title">
              <Icon name="check" play={freshCatch ? freshCatch.n : undefined} />
              {remaining
                ? `${caught.length} of ${plural(task.bugs.length, 'bug')} caught`
                : `All ${plural(task.bugs.length, 'bug')} caught`}
            </h3>
            <div className="break-meter" aria-hidden="true">
              {task.bugs.map((bug, index) => (
                <span
                  key={bug.id}
                  data-done={index < caught.length || undefined}
                  className={
                    freshCatch && index >= caught.length - freshCatch.newly.length && index < caught.length ? 'is-fresh' : undefined
                  }
                />
              ))}
            </div>
            <p>
              Try #{lastCatch + 1}, {describeInput(task, catchTry.input)}: the suspect says {catchTry.suspect}; the contract says{' '}
              {catchTry.contract}.{firstCaughtBy < lastCatch && ` That is the bug try #${firstCaughtBy + 1} caught.`}{' '}
              {remaining
                ? remaining === 1
                  ? 'One bug is still hiding.'
                  : `${remaining} bugs are still hiding.`
                : 'Every hidden bug is caught.'}
            </p>
            <label className="field-label" htmlFor="break-explanation">
              {caught.length > 1 ? 'What are the bugs? One sentence each.' : 'What is the bug, in one sentence?'}
            </label>
            <Textarea
              id="break-explanation"
              rows={caught.length > 1 ? 3 : 2}
              value={attempt.explanation}
              placeholder="It returns … when …"
              onChange={event => save('explanation', event.target.value)}
            />
            <p className="break-note">This is your explanation. You review it yourself; the checks only confirm the catches.</p>
            <div className="break-actions">
              {remaining ? (
                <Button variant="primary" onClick={() => firstField.current?.focus()}>
                  Keep hunting
                  <Icon name="search" />
                </Button>
              ) : (
                <Button variant="primary" onClick={() => onReveal('review-section')}>
                  Go to Finish
                  <Icon name="arrow" />
                </Button>
              )}
              <Button variant="text" onClick={() => onReveal(remaining ? 'brief-section' : 'explain-section')}>
                {remaining ? 'Reread the contract' : 'Compare in Explain'}
                <Icon name="arrow" />
              </Button>
            </div>
          </section>
        )}
        {rows.length || running ? (
          <ol className="break-log" aria-label="Your tries, newest first">
            {running && (
              <li key={tries.length + 1} className="break-row is-new">
                <span className="break-n">#{tries.length + 1}</span>
                <code className="break-input">{describeInput(task, running.input)}</code>
                <span className="break-values">
                  <span className="is-loading">Running</span>
                </span>
              </li>
            )}
            {rows.map(({ item, n }) => {
              const isFresh = fresh?.n === n
              const caughtHere = item.caught.length > 0
              const earlier = caughtBugs(task, tries.slice(0, n - 1))
              const newHere = item.caught.filter(id => !earlier.includes(id)).length
              // Only edited saved data can hold a try outside the contract; the worker ran nothing for it.
              if (!followsRules(task, item.input))
                return (
                  <li key={n} className="break-row">
                    <span className="break-n">#{n}</span>
                    <code className="break-input">{describeInput(task, item.input)}</code>
                    <span className="break-values" />
                    <StatusChip tone="attention">Outside the contract</StatusChip>
                  </li>
                )
              return (
                <li key={n} className={`break-row${isFresh ? ' is-new' : ''}`}>
                  <span className="break-n">#{n}</span>
                  <code className="break-input">{describeInput(task, item.input)}</code>
                  <span className="break-values">
                    {caughtHere ? (
                      <s className="break-strike">
                        suspect {item.suspect}
                        <span className="visually-hidden">, wrong</span>
                      </s>
                    ) : (
                      <span>suspect {item.suspect}</span>
                    )}
                    <span>contract {item.contract}</span>
                  </span>
                  {caughtHere ? (
                    <StatusChip tone={newHere ? 'success' : 'progress'}>
                      <Icon name="check" play={isFresh ? n : undefined} />
                      {newHere === 0 ? 'Caught again' : newHere === 1 ? 'Caught one' : `Caught ${newHere}`}
                    </StatusChip>
                  ) : (
                    <StatusChip>Same answer</StatusChip>
                  )}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="break-empty">No tries yet. Pick values the contract cares about, then press Try it.</p>
        )}
        <p className="visually-hidden" role="status">
          {announcement}
        </p>
      </section>
    </div>
  )
}
