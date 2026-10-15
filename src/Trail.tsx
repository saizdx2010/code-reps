import { Icon } from './Icon'
import { StatusChip } from './Layout'
import { preloadEditor } from './editor-loader'
import { stageLabels } from './learning.ts'
import { repLevelLabel, stageLevelRange } from './rep-levels.ts'
import type { TrailNode, TrailStage } from './trail-map'

type Props = {
  stages: TrailStage[]
  evidence: (repId: string) => string
  onOpenRep: (repId: string) => void
  onOpenLesson: (skillId: string) => void
  onOpenFoundations?: () => void
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
      : node.kind === 'project'
        ? 'flag'
        : node.role === 'Recall'
          ? 'repeat'
          : 'circle'
type Stage = Props['stages'][number]
const stageDone = (stage: Stage) => stage.total > 0 && stage.done === stage.total
const stageSummary = (stage: Stage) =>
  stageDone(stage) && stage.recap
    ? stage.recap
    : stage.covered
      ? 'Covered in Foundations. Open it to revisit these reps here.'
      : stage.description
const levelRange = (stage: TrailStage) => stageLevelRange(stage.nodes.flatMap(node => (node.kind === 'lesson' ? [] : [node.repId])))

/** A path drawn as stages of connected nodes: lessons before the reps that use them, then recall and projects. */
export function Trail({ stages, evidence, onOpenRep, onOpenLesson, onOpenFoundations }: Props) {
  return (
    <ol className="trail path-stages">
      {stages.map((stage, index) => (
        <li key={stage.title} className={`trail-stage${stage.current ? ' is-current' : ''}${stageDone(stage) ? ' is-done' : ''}`}>
          <details
            className="path-stage"
            open={
              stage.current ||
              (index === 0 && !stage.covered && stage.done < stage.total) ||
              stage.nodes.every(node => node.kind === 'project')
            }
          >
            <summary className="path-stage-heading">
              <span className="trail-stage-index" aria-hidden="true">
                {stageDone(stage) ? <Icon name="check" /> : String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{stage.title}</h3>
                <p>{stageSummary(stage)}</p>
                {levelRange(stage) && <StatusChip>{levelRange(stage)}</StatusChip>}
              </div>
              <span className="trail-stage-count">
                {stage.done}/{stage.total}
              </span>
            </summary>
            {stage.covered && onOpenFoundations && (
              <button type="button" className="text-button trail-covered" onClick={onOpenFoundations}>
                Open Foundations
              </button>
            )}
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
                      <button type="button" className="text-button" onClick={() => onOpenRep(node.repId)}>
                        Open project milestone
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`trail-${node.repId}`}
                      aria-current={node.state === 'next' ? 'step' : undefined}
                      onMouseEnter={preloadEditor}
                      onFocus={preloadEditor}
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
