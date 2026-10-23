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
const levelRange = (stage: TrailStage) =>
  stageLevelRange(stage.nodes.flatMap(node => (node.kind === 'rep' || node.kind === 'project' ? [node.repId] : [])))

/** A path drawn as stages of connected nodes: lessons before the reps that use them, then recall and projects. */
export function Trail({ stages, evidence, onOpenRep, onOpenLesson, onOpenTrack, text, reward }: Props) {
  // One stage opens: the current one, or the first unfinished stage when nothing is current yet.
  const hasCurrent = stages.some(stage => stage.current)
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
                {stageSummary(stage, text?.[stage.title]) && <p>{stageSummary(stage, text?.[stage.title])}</p>}
                {levelRange(stage) && <StatusChip>{levelRange(stage)}</StatusChip>}
              </div>
              <span className="trail-stage-count">{stage.total ? `${stage.done}/${stage.total}` : 'Self-review'}</span>
            </summary>
            {stage.coveredBy && onOpenTrack && (
              <Button variant="text" className="trail-covered" onClick={() => onOpenTrack(stage.coveredBy!.id)}>
                Open {stage.coveredBy.title}
              </Button>
            )}
            {reward?.(stage)}
            <ol className="trail-nodes">
              {stage.nodes.map(node => (
                <li key={node.id} className={`trail-node node-${node.kind} is-${node.state}`}>
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
                          <small className={node.state === 'open' ? 'visually-hidden' : undefined}>{stateLabels[node.state]}</small>
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
