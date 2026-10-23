import { useEffect, useMemo, useState } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'
import { StatusChip } from './Layout'
import type { PortableRecord } from './portability'
import { newlyLitPart, rewardProgress, stageReward, stageRewards } from './toy-rewards.ts'
import type { StageReward } from './toy-rewards.ts'
import type { TrailStage } from './trail-map'
import { goToView } from './ui-navigation'
import { useSessionPreference } from './useSessionPreference'
import './toy-rewards.css'

// Where playable rewards show outside their toys: a line on the trail stages that light parts, a card in Library →
// Projects, and a note in the completion panel when a rep lights a part. Each loads after the page it sits on.

/**
 * The line an open trail stage shows when its reps light parts of a toy: how many parts are lit, how many reps until the
 * toy can do its next thing, and a way to open it. The toy opens at any time; nothing on the trail is locked by it.
 */
export function StageRewardLine({ trackId, stage, history }: { trackId: string; stage: TrailStage; history: PortableRecord[] }) {
  const reward = stageReward(
    trackId,
    stage.nodes.flatMap(node => (node.kind === 'rep' ? [node.repId] : [])),
  )
  if (!reward) return null
  return (
    <p className="stage-reward">
      <Icon name="play" />
      <span>{rewardProgress(reward, history).line}</span>
      <Button variant="text" onClick={() => goToView(reward.toyId)}>
        Open {reward.title}
        <Icon name="arrow" />
      </Button>
    </p>
  )
}

/** Each toy's card in Library → Projects, beside the Game of Life. */
export function ToyCards({ history }: { history: PortableRecord[] }) {
  return stageRewards.map(reward => <ToyCard key={reward.toyId} reward={reward} history={history} />)
}

function ToyCard({ reward, history }: { reward: StageReward; history: PortableRecord[] }) {
  const progress = rewardProgress(reward, history)
  const id = `toy-card-${reward.toyId}`
  return (
    <article className="hub-panel toy-card" aria-labelledby={id}>
      <header>
        <div>
          <h3 id={id}>{reward.title}</h3>
          <p>
            Runs on your code · {progress.lit} of {progress.total} parts lit
          </p>
        </div>
        <StatusChip tone="progress">Toy</StatusChip>
      </header>
      <p>
        {reward.about} {progress.until ?? 'Every part is lit.'}
      </p>
      <Button variant="primary" onClick={() => goToView(reward.toyId)}>
        Open {reward.title}
        <Icon name="arrow" />
      </Button>
    </article>
  )
}

/**
 * In the completion panel, once: the part this completion lit for the first time, and a way to try it. Shown only for a
 * rep completed in this view, and remembered for the browser session so returning to the rep does not repeat it.
 */
export function NewPartNotice({ history, recordId, fresh }: { history: PortableRecord[]; recordId: string; fresh: boolean }) {
  const lit = useMemo(() => (fresh ? newlyLitPart(history, recordId) : null), [fresh, history, recordId])
  const [announced, setAnnounced] = useSessionPreference<string>('toy-parts-announced', '')
  const [shownBefore] = useState(() => announced.split(' ').includes(recordId))
  useEffect(() => {
    if (lit && !announced.split(' ').includes(recordId)) setAnnounced(`${announced} ${recordId}`.trim())
  }, [lit, announced, recordId, setAnnounced])
  if (!lit || shownBefore) return null
  return (
    <p className="new-part-notice">
      <Icon name="play" />
      <span>
        <strong>New part lit:</strong> {lit.part.label}.{' '}
        <Button variant="text" onClick={() => goToView(lit.reward.toyId)}>
          Try it in the {lit.reward.title}
          <Icon name="arrow" />
        </Button>
      </span>
    </p>
  )
}
