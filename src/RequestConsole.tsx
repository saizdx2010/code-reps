import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { Select, Textarea } from './Input'
import { InfoNote, PageHeader, StatusChip } from './Layout'
import type { PortableRecord } from './portability'
import { consoleExamples, consoleParts, consoleReward, consoleRoutes, readRequest, runRequest } from './request-console.ts'
import type { ConsoleCall, ConsoleResponse, ConsoleResult, ConsoleSources, ConsoleStep, RawRequest } from './request-console.ts'
import { repTitle } from './rep-index.ts'
import { latestCompletedCode, rewardProgress } from './toy-rewards.ts'
import { toySession } from './toy-session'
import type { ChipTone } from './ui-status'
import { useSessionPreference } from './useSessionPreference'
import { describeDifference } from './value-diff.ts'
import './request-console.css'

type Props = { history: PortableRecord[]; openRep: (id: string) => void; onProjects: () => void }
type Part = (typeof consoleParts)[number]
type Shown = 'lit' | 'unlit' | 'not-reached' | ConsoleStep['state']

const chips: Record<Shown, [string, ChipTone]> = {
  lit: ['Lit', 'success'],
  unlit: ['Not lit', 'neutral'],
  'not-reached': ['Not reached', 'neutral'],
  agrees: ['Agrees', 'success'],
  differs: ['Differs', 'attention'],
  threw: ['Threw', 'attention'],
}
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * The Request console: a raw HTTP request sent through the learner's own saved solutions to the Backend track's request
 * and routing reps. A part is lit when its rep is completed with saved code; the request stops at the first part that is
 * not lit, throws, or disagrees with its contract. Nothing here is saved or counts as evidence.
 */
export default function RequestConsole({ history, openRep, onProjects }: Props) {
  const sources = useMemo(() => {
    const found: ConsoleSources = {}
    for (const part of consoleParts) {
      const code = latestCompletedCode(history, part.repId)
      if (code) found[part.id] = code
    }
    return found
  }, [history])
  // Keyed by the code itself, so a new history array with the same saved code keeps the worker and any run in progress.
  const key = JSON.stringify(sources)
  const session = useMemo(
    () => toySession<RawRequest, ConsoleResult>('request-console', JSON.parse(key) as ConsoleSources, 'console'),
    [key],
  )
  useEffect(() => () => session.close(), [session])
  const progress = rewardProgress(consoleReward, history)
  const [text, setText] = useSessionPreference<string>('console-request', consoleExamples[0].text)
  const example = consoleExamples.find(item => item.text === text)?.id ?? 'own'
  const [result, setResult] = useState<ConsoleResult | null>(null)
  // Each answer is drawn afresh, so its parts land in order again even when it matches the last one.
  const [run, setRun] = useState(0)
  const [problem, setProblem] = useState('')
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  // Editing or choosing another request drops the answer to the old one and stops a run still going.
  const version = useRef(0)
  // A part lit since the console was last open in this browser session lights up once.
  const [seen, setSeen] = useSessionPreference<string>('console-lit-seen', '')
  const [seenOnArrival] = useState(() => new Set(seen.split(' ')))
  const lit = consoleParts
    .filter(part => sources[part.id])
    .map(part => part.id)
    .join(' ')
  useEffect(() => {
    if (lit !== seen) setSeen(lit)
  }, [lit, seen, setSeen])

  function edit(next: string) {
    version.current++
    if (busy) session.close()
    setText(next)
    setResult(null)
    setProblem('')
    setFailure('')
  }
  async function send() {
    const framed = readRequest(text)
    if (!framed.ok) {
      setResult(null)
      setFailure('')
      return setProblem(framed.problem)
    }
    setProblem('')
    setFailure('')
    const started = ++version.current
    setRun(started)
    // Without its first part nothing of the learner's runs, so there is no worker to start to say where it stops.
    if (!sources.line) return setResult(runRequest(framed.request, {}))
    setBusy(true)
    const outcome = await session.run(framed.request)
    setBusy(false)
    if (version.current !== started) return
    if ('error' in outcome) {
      // A closed session (the page left, or the saved code changed) ends quietly.
      setResult(null)
      if (outcome.error) setFailure(outcome.error)
    } else setResult(outcome)
  }

  const steps = new Map(result?.steps.map(step => [step.part, step]))
  const stopped = result && !result.response ? result.steps.at(-1) : undefined
  const shown = (part: Part): Shown => (result ? (steps.get(part.id)?.state ?? 'not-reached') : sources[part.id] ? 'lit' : 'unlit')
  return (
    <main className="console-main">
      <PageHeader
        back={{ label: 'Projects', onClick: onProjects }}
        title="Request console"
        description="Send a raw HTTP request through your own Backend solutions, one part at a time."
      />
      <div className="console-layout">
        <section className="console-request" aria-labelledby="console-request-title">
          <h2 id="console-request-title">Request</h2>
          <label className="console-field">
            Start from
            <Select value={example} onChange={event => edit(consoleExamples.find(item => item.id === event.target.value)?.text ?? text)}>
              {consoleExamples.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              {example === 'own' && <option value="own">Your own request</option>}
            </Select>
          </label>
          <label className="console-field">
            Raw request
            <Textarea
              className="console-text"
              value={text}
              onChange={event => edit(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              rows={9}
              aria-describedby="console-format"
              aria-invalid={problem ? true : undefined}
            />
          </label>
          <p id="console-format" className="console-help">
            The request line, then one header per line, then a blank line and the body.
          </p>
          {problem && (
            <p className="console-problem" role="alert">
              <Icon name="alert" />
              {problem}
            </p>
          )}
          <Button variant="primary" onClick={() => void send()} disabled={busy}>
            Send through your parts
            <Icon name="play" />
          </Button>
          <details className="console-routes">
            <summary>Routes this service knows</summary>
            <ul>
              {consoleRoutes.map(route => (
                <li key={`${route.method} ${route.pattern}`}>
                  <code>
                    {route.method} {route.pattern}
                  </code>
                  <span>{route.name}</span>
                </li>
              ))}
            </ul>
            <p>Every request other than GET and HEAD must send a JSON object: your readJsonBody reads the body before routing.</p>
          </details>
        </section>
        <section className="console-flow" aria-labelledby="console-flow-title" aria-busy={busy || undefined}>
          <div className="console-flow-head">
            <h2 id="console-flow-title">Your parts</h2>
            <p>{progress.summary}</p>
            <p className="console-summary" role="status">
              {busy
                ? 'Running your code…'
                : failure
                  ? ''
                  : result?.response
                    ? `Answered ${result.response.status} ${'error' in result.response ? result.response.error : `by ${result.response.handler}`}.`
                    : stopped
                      ? `Stopped at ${consoleParts.find(part => part.id === stopped.part)!.label}.`
                      : ''}
            </p>
          </div>
          {failure && (
            <div className="console-failure" role="alert">
              <Icon name="alert" />
              <p>{failure}</p>
            </div>
          )}
          <ol className={`console-parts${result ? ' has-result' : ''}`}>
            {consoleParts.map((part, index) => (
              <PartRow
                key={part.id}
                index={index}
                run={run}
                part={part}
                shown={shown(part)}
                lit={Boolean(sources[part.id])}
                fresh={Boolean(sources[part.id]) && !seenOnArrival.has(part.id)}
                step={steps.get(part.id)}
                openRep={openRep}
              />
            ))}
          </ol>
          {result?.response && <Response key={run} response={result.response} />}
        </section>
      </div>
      <InfoNote label="What the console shows">
        <p>
          The console runs your latest completed solution for each part in the practice worker, never on this page, and compares every
          answer with that rep’s written contract. A lit part means its rep is completed and your saved code runs here; it does not prove
          mastery. A part that is not lit stops the request: the console never fills it in with someone else’s code.
        </p>
        <p>
          Your code runs for personal practice, not in secure isolation, and is stopped after five seconds. Nothing here is saved, counted,
          or changes a skill.
        </p>
      </InfoNote>
    </main>
  )
}

function PartRow({
  index,
  run,
  part,
  shown,
  lit,
  fresh,
  step,
  openRep,
}: {
  index: number
  run: number
  part: Part
  shown: Shown
  lit: boolean
  fresh: boolean
  step?: ConsoleStep
  openRep: (id: string) => void
}) {
  const [label, tone] = chips[shown]
  const title = repTitle(part.repId)
  return (
    <li
      className={`console-part is-${shown}${lit ? ' is-lit' : ''}`}
      data-fresh={fresh || undefined}
      style={{ '--part': index } as CSSProperties}
    >
      <span className="console-marker" aria-hidden="true">
        <Icon name={lit ? 'check' : 'circle'} />
      </span>
      <div className="console-part-body">
        <div className="console-part-head">
          <h3>{sentence(part.label)}</h3>
          <code>{part.functionName}</code>
          <StatusChip tone={tone}>{label}</StatusChip>
        </div>
        {lit ? (
          <p className="console-part-source">From your completed {title}</p>
        ) : (
          <p className="console-part-source">
            Complete {title} to light this part.{' '}
            <Button variant="text" onClick={() => openRep(part.repId)}>
              Open the rep
              <Icon name="arrow" />
            </Button>
          </p>
        )}
        {step && (
          <div className="console-result" key={run}>
            {step.state === 'unlit' ? (
              <p className="console-stop">The request stops here until this part is lit.</p>
            ) : step.state === 'agrees' ? (
              <Calls calls={step.calls} part={part} />
            ) : (
              <Disagreement step={step} part={part} title={title} openRep={openRep} />
            )}
          </div>
        )}
      </div>
    </li>
  )
}

function Calls({ calls, part }: { calls: ConsoleCall[]; part: Part }) {
  if (!calls.length) return <p className="console-calls-empty">No headers were sent, so your {part.functionName} had nothing to read.</p>
  return (
    <ul className="console-calls" aria-label={`Your ${part.functionName} calls`}>
      {calls.map((call, index) => (
        <li key={index}>
          <code>{call.call}</code>
          <Icon name="arrow" still />
          <span className="visually-hidden"> returned </span>
          <code>{call.output}</code>
        </li>
      ))}
    </ul>
  )
}

function Disagreement({
  step,
  part,
  title,
  openRep,
}: {
  step: Extract<ConsoleStep, { calls: ConsoleCall[] }>
  part: Part
  title: string
  openRep: (id: string) => void
}) {
  // A part that disagrees ends with the call that did; one that threw ends after its last agreeing call.
  const call = step.state === 'differs' ? step.calls.at(-1) : undefined
  const agreed = step.state === 'differs' ? step.calls.slice(0, -1) : step.calls
  const difference = step.state === 'differs' && call ? describeDifference(call.expected, call.output) : null
  return (
    <>
      {agreed.length > 0 && <Calls calls={agreed} part={part} />}
      <div className="console-difference" role="alert">
        <Icon name="alert" />
        <div>
          {step.state === 'threw' ? (
            <p>
              <strong>{step.error}</strong> The request stops here.
            </p>
          ) : (
            <>
              <p>
                <strong>Your {part.functionName} disagrees with its contract here.</strong> It passed its checks when you completed it, so
                this is a case they did not cover. The request stops here.
              </p>
              {call && (
                <dl>
                  <div>
                    <dt>Call</dt>
                    <dd>
                      <code>{call.call}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Yours</dt>
                    <dd>
                      <code>{call.output}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Contract</dt>
                    <dd>
                      <code>{call.expected}</code>
                    </dd>
                  </div>
                </dl>
              )}
              {difference && <p>{difference}</p>}
              {call?.changedInput && <p>It also changed its input, which the contract does not allow.</p>}
            </>
          )}
          <Button variant="primary" onClick={() => openRep(part.repId)}>
            Open {title}
            <Icon name="arrow" />
          </Button>
        </div>
      </div>
    </>
  )
}

const json = (value: unknown) => JSON.stringify(value)

function Response({ response }: { response: ConsoleResponse }) {
  const by = consoleParts.find(part => part.id === response.by)!
  return (
    <section className={`console-response${'error' in response ? '' : ' is-handled'}`} aria-labelledby="console-response-title">
      <h3 id="console-response-title">
        <span className="console-status">{response.status}</span>
        {'error' in response ? (
          <code>{response.error}</code>
        ) : (
          <span>
            Handled by <code>{response.handler}</code>
          </span>
        )}
      </h3>
      {'error' in response ? (
        <p>
          {response.by === 'query'
            ? 'Your decodeQuery found a malformed escape. Its contract gives no status, so the console answers 400.'
            : response.by === 'path'
              ? 'Your normalizePath found a path that climbs above the root. Its contract gives no status, so the console answers 400.'
              : `Your ${by.functionName} answered for the service.`}
          {response.allow && (
            <>
              {' '}
              Allowed here: <code>{response.allow.join(', ')}</code>.
            </>
          )}
        </p>
      ) : (
        <>
          <p>Your routeRequest chose this handler. It is the console’s stand-in: it shows what a handler would receive and runs nothing.</p>
          <dl className="console-received">
            <div>
              <dt>Params</dt>
              <dd>
                <code>{json(response.received.params)}</code>
              </dd>
            </div>
            <div>
              <dt>Query</dt>
              <dd>
                <code>{json(response.received.query)}</code>
              </dd>
            </div>
            <div>
              <dt>Headers</dt>
              <dd>
                <code>{json(response.received.headers)}</code>
              </dd>
            </div>
            <div>
              <dt>Body</dt>
              <dd>
                <code>{json(response.received.body)}</code>
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
