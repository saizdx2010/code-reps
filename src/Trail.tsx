import { Icon } from './Icon'
import { preloadEditor } from './editor-loader'
import type { TrailNode, TrailStage } from './trail-map'

type Props = {
  stages: TrailStage[]
  evidence: (repId: string) => string
  onOpenRep: (repId: string) => void
  onOpenLesson: (skillId: string) => void
  onOpenFoundations?: () => void
}

const stateLabels: Record<string, string> = { done: 'Completed', next: 'Next on your trail', draft: 'In progress', later: 'Recall available later', open: 'Not started' }
const markerIcon = (node: TrailNode) => node.state === 'done' ? 'check' : node.kind === 'lesson' ? 'book' : node.kind === 'project' ? 'flag' : node.role === 'Recall' ? 'repeat' : 'circle'

/** A path drawn as stages of connected nodes: lessons before the reps that use them, then recall and projects. */
export function Trail({ stages, evidence, onOpenRep, onOpenLesson, onOpenFoundations }: Props) {
  return <ol className="trail path-stages">{stages.map((stage, index) => <li key={stage.title} className={`trail-stage${stage.current ? ' is-current' : ''}${stage.total > 0 && stage.done === stage.total ? ' is-done' : ''}`}>
    <details className="path-stage" open={stage.current || index === 0 && !stage.covered && stage.done < stage.total || stage.nodes.every(node => node.kind === 'project')}>
      <summary className="path-stage-heading">
        <span className="trail-stage-index" aria-hidden="true">{stage.total > 0 && stage.done === stage.total ? <Icon name="check" /> : String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3>{stage.title}</h3>
          <p>{stage.covered ? 'Covered in Foundations. Open it to revisit these reps here.' : stage.description}</p>
        </div>
        <span className="trail-stage-count">{stage.done}/{stage.total}</span>
      </summary>
      {stage.covered && onOpenFoundations && <button type="button" className="text-button trail-covered" onClick={onOpenFoundations}>Open Foundations</button>}
      <ol className="trail-nodes">{stage.nodes.map(node => <li key={node.id} className={`trail-node node-${node.kind} is-${node.state}`}>
        <span className="trail-marker" aria-hidden="true"><Icon name={markerIcon(node)} /></span>
        {node.kind === 'lesson'
          ? <button type="button" onClick={() => onOpenLesson(node.skillId)}><span className="trail-node-title">Lesson: {node.title}</span><small>{node.state === 'done' ? 'Predictions checked' : 'Read and predict before practising'}</small></button>
          : node.kind === 'project'
            ? <div className="trail-project"><span className="trail-node-title">{node.title}</span><small>{node.reason}</small><button type="button" className="text-button" onClick={() => onOpenRep(node.repId)}>Open project milestone</button></div>
            : <button type="button" aria-current={node.state === 'next' ? 'step' : undefined} onMouseEnter={preloadEditor} onFocus={preloadEditor} onClick={() => onOpenRep(node.repId)}>
              <span className="trail-node-title">{node.title}</span>
              <small><span className="path-role">{node.role === 'Application' ? '' : `${node.role} · `}{stateLabels[node.state]}</span>{evidence(node.repId) && <span className="path-evidence">{evidence(node.repId)}</span>}</small>
            </button>}
      </li>)}</ol>
    </details>
  </li>)}</ol>
}
