import type { ReactNode } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { preloadPractice } from './editor-loader'
import { stageLabels } from './learning.ts'
import { repLevelLabel, stageLevelRange } from './rep-levels.ts'
import type { StageText } from './path-text'
import type { TrailNode, TrailStage } from './trail-map'
import { openExternalProject } from './ui-navigation'
import { useSessionPreference } from './useSessionPreference'
import { useEffect, useState } from 'react'
import { formatDate, plural } from './ui-copy.ts'

type Props = {
  stages: TrailStage[]
  evidence: (repId: string) => string
  onOpenRep: (repId: string) => void
  onOpenLesson: (skillId: string) => void
  /** Opens the track that owns a linked stage, such as Foundations. */
  onOpenTrack?: (pathId: string) => void
  /** Each stage's description and recap by title. They load after the trail, so a stage may have none yet. */
  text?: Readonly<Record<string, StageText>>
  /** A stage's playable reward line (src/ToyRewards.tsx), which also loads after the trail. */
  reward?: (stage: TrailStage) => ReactNode
}

const stateLabels: Record<string, string> = {
  done: 'Completed',
  next: 'Next',
  draft: 'In progress',
  later: 'Recall later',
  open: 'Not started',
}
// Journey evidence is shown once there is some: an untouched journey says nothing rather than "Learning".
const untouched = `: ${stageLabels.learning}.`
const markerIcon = (node: TrailNode) =>
  node.state === 'done'
    ? 'check'
    : node.kind === 'lesson'
      ? 'book'
      : node.kind === 'project' || node.kind === 'external'
        ? 'flag'
        : node.role === 'Recall'
          ? 'repeat'
          : 'circle'
type Stage = Props['stages'][number]
const stageDone = (stage: Stage) => stage.total > 0 && stage.done === stage.total
const stageSummary = (stage: Stage, text?: StageText) =>
  stageDone(stage) && text?.recap
    ? text.recap
    : stage.coveredBy
      ? `Covered in ${stage.coveredBy.title}. Open it to revisit these reps here.`
      : (text?.description ?? stage.description)
/** What is left in a started stage, by kind: "2 reps, 1 recall, and 1 lesson left". */
function stageLeft(stage: Stage) {
  const open = stage.nodes.filter(node => node.state !== 'done' && node.kind !== 'external')
  const recall = open.filter(node => node.kind === 'rep' && node.role === 'Recall').length
  const parts = [
    [open.filter(node => node.kind === 'rep').length - recall, 'rep'],
    [recall, 'recall'],
    [open.filter(node => node.kind === 'lesson').length, 'lesson'],
    [open.filter(node => node.kind === 'project').length, 'project'],
  ]
    .filter(([count]) => count)
    .map(([count, word]) => `${count} ${word}${count === 1 || word === 'recall' ? '' : 's'}`)
  if (!parts.length) return ''
  return `${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]} left`
}
const days = (ms: number) => Math.max(1, Math.ceil(ms / 86_400_000))
const laterLabel = (node: TrailNode) =>
  node.kind === 'rep' && node.recallAt
    ? days(node.recallAt - Date.now()) === 1
      ? 'Recall opens tomorrow'
      : `Recall in ${days(node.recallAt - Date.now())} days`
    : stateLabels.later
const done = (node?: TrailNode) => node?.state === 'done'
const recent = (node: TrailNode | undefined, since: number) => node?.kind === 'rep' && (node.completedAt ?? 0) >= since
/** The walked part of the line: between two completed nodes, stronger when the later one was completed this month. */
const walk = (later: TrailNode | undefined, earlier: TrailNode | undefined, since: number) =>
  done(later) && done(earlier) ? (recent(later, since) ? 'recent' : 'done') : undefined

/**
 * Completed reps the trail has not shown before in this session, so returning from a finished rep plays its node's check
 * once. Without an earlier record (a first visit), nothing plays. The record is session UI state, never in backups.
 */
function useFreshNodes(stages: TrailStage[]) {
  const doneIds = stages.flatMap(stage => stage.nodes.flatMap(node => (node.kind === 'rep' && node.state === 'done' ? [node.repId] : [])))
  const [seen, setSeen] = useSessionPreference<string>('trail-done-seen', '')
  const seenIds = seen ? seen.split(' ').filter(Boolean) : null
  const [fresh] = useState(() => new Set(seenIds ? doneIds.filter(id => !seenIds.includes(id)) : []))
  // Every completed rep any trail has shown, so switching tracks never replays another track's checks.
  const record = `seen ${[...new Set([...(seenIds ?? []).filter(id => id !== 'seen'), ...doneIds])].join(' ')}`.trim()
  useEffect(() => {
    if (seen !== record) setSeen(record)
  }, [record, seen, setSeen])
  return fresh
}

const levelRange = (stage: TrailStage) =>
  stageLevelRange(stage.nodes.flatMap(node => (node.kind === 'rep' || node.kind === 'project' ? [node.repId] : [])))

/** A path drawn as stages of connected nodes: lessons before the reps that use them, then recall and projects. */
export function Trail({ stages, evidence, onOpenRep, onOpenLesson, onOpenTrack, text, reward }: Props) {
  // One stage opens: the current one, or the first unfinished stage when nothing is current yet.
  const hasCurrent = stages.some(stage => stage.current)
  const fresh = useFreshNodes(stages)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  return (
    <ol className="trail path-stages">
      {stages.map((stage, index) => (
        <li key={stage.title} className={`trail-stage${stage.current ? ' is-current' : ''}${stageDone(stage) ? ' is-done' : ''}`}>
          <details
            className="path-stage"
            open={
              stage.current ||
              (!hasCurrent && index === 0 && !stage.covered && stage.done < stage.total) ||
              stage.nodes.every(node => node.kind === 'project' || node.kind === 'external')
            }
          >
            <summary className="path-stage-heading">
              <span className="trail-stage-index" aria-hidden="true">
                {stageDone(stage) ? <Icon name="check" /> : String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{stage.title}</h3>
                {/* A finished stage folds to one row: when it was finished, then its recap on one line. */}
                {(stage.finishedAt || stageSummary(stage, text?.[stage.title])) && (
                  <p>
                    {stage.finishedAt && <span className="trail-stage-finished">Completed {formatDate(stage.finishedAt)}</span>}
                    {stageSummary(stage, text?.[stage.title])}
                  </p>
                )}
                {levelRange(stage) && <StatusChip>{levelRange(stage)}</StatusChip>}
                {!stage.covered && !stageDone(stage) && (stage.current || stage.done > 0) && stageLeft(stage) && (
                  <p className="trail-left">{stageLeft(stage)}</p>
                )}
              </div>
              <span className="trail-stage-count">
                {stage.finishedAt
                  ? `${stage.total} ${plural(stage.total, 'rep')}`
                  : stage.total
                    ? `${stage.done}/${stage.total}`
                    : 'Self-review'}
              </span>
            </summary>
            {stage.coveredBy && onOpenTrack && (
              <Button variant="text" className="trail-covered" onClick={() => onOpenTrack(stage.coveredBy!.id)}>
                Open {stage.coveredBy.title}
              </Button>
            )}
            {reward?.(stage)}
            <ol className="trail-nodes">
              {stage.nodes.map((node, at) => (
                <li
                  key={node.id}
                  className={`trail-node node-${node.kind} is-${node.state}${node.kind === 'rep' && fresh.has(node.repId) ? ' is-fresh' : ''}`}
                  data-walk-up={walk(node, stage.nodes[at - 1], monthStart)}
                  data-walk-down={walk(stage.nodes[at + 1], node, monthStart)}
                >
                  <span className="trail-marker" aria-hidden="true">
                    <Icon name={markerIcon(node)} />
                  </span>
                  {node.kind === 'lesson' ? (
                    <button type="button" id={`trail-lesson-${node.skillId}`} onClick={() => onOpenLesson(node.skillId)}>
                      <span className="trail-node-title">Lesson: {node.title}</span>
                      <span className="trail-node-state">
                        <small>{node.state === 'done' ? 'Predictions checked' : 'Read and predict first'}</small>
                      </span>
                    </button>
                  ) : node.kind === 'project' ? (
                    <div className="trail-project">
                      <span className="trail-node-title">{node.title}</span>
                      {repLevelLabel(node.repId) && <StatusChip>{repLevelLabel(node.repId)}</StatusChip>}
                      <small>{node.reason}</small>
                      <Button variant="text" onClick={() => onOpenRep(node.repId)}>
                        Open project milestone
                      </Button>
                    </div>
                  ) : node.kind === 'external' ? (
                    <div className="trail-project">
                      <span className="trail-node-title">{node.title}</span>
                      <small>External project · Self-review</small>
                      <small>{node.reason}</small>
                      <Button variant="text" onClick={() => openExternalProject(node.projectId)}>
                        Open project brief
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`trail-${node.repId}`}
                      aria-current={node.state === 'next' ? 'step' : undefined}
                      onMouseEnter={() => preloadPractice(node.repId)}
                      onFocus={() => preloadPractice(node.repId)}
                      onClick={() => onOpenRep(node.repId)}
                    >
                      {node.state === 'next' && (
                        <span className="trail-here" aria-hidden="true">
                          You are here
                        </span>
                      )}
                      <span className="trail-node-title">{node.title}</span>
                      {repLevelLabel(node.repId) && repLevelLabel(node.repId) !== levelRange(stage) && (
                        <StatusChip>{repLevelLabel(node.repId)}</StatusChip>
                      )}
                      <span className="trail-node-state">
                        {node.role !== 'Application' && node.state !== 'later' && <span className="path-role">{node.role}</span>}
                        {node.state === 'next' || node.state === 'draft' ? (
                          <StatusChip tone="progress">
                            {node.state === 'next' && node.inProgress ? 'Next · In progress' : stateLabels[node.state]}
                          </StatusChip>
                        ) : (
                          <small className={node.state === 'open' ? 'visually-hidden' : undefined}>
                            {node.state === 'later' ? laterLabel(node) : stateLabels[node.state]}
                          </small>
                        )}
                      </span>
                      {evidence(node.repId) && !evidence(node.repId).endsWith(untouched) && (
                        <small className="path-evidence">{evidence(node.repId)}</small>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </details>
        </li>
      ))}
    </ol>
  )
}
