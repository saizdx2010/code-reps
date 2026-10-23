import type { PortableRecord } from './portability.ts'
import type { View } from './ui-navigation.ts'

// Playable rewards: finishing a track's reps lights the parts of a toy that runs the learner's own saved solutions. A part
// is lit when its rep has a completed attempt with saved code, so everything here is worked out from saved attempts and
// nothing is stored. Lit means the code runs in the toy; it is not evidence of mastery and never changes a skill.
// A reward lists its parts in the order the toy runs them. Trail stages that hold a part's rep show the reward's line.

export type ToyPart = { id: string; repId: string; label: string }
export type StageReward = {
  trackId: string
  /** The toy's page. */
  toyId: View
  title: string
  /** One line for the toy's card in Library → Projects. */
  about: string
  parts: readonly ToyPart[]
  /** What the toy can do once its first `parts` parts are lit, in order: "2 reps until requests parse." */
  milestones: readonly { parts: number; does: string }[]
}

export const stageRewards: readonly StageReward[] = [
  {
    trackId: 'backend',
    toyId: 'request-console',
    title: 'Request console',
    about: 'Type a raw HTTP request and watch it pass through your own request and routing reps from the Backend track.',
    parts: [
      { id: 'line', repId: 'backend-request-line', label: 'request line' },
      { id: 'target', repId: 'backend-split-target', label: 'target split' },
      { id: 'query', repId: 'backend-decode-query', label: 'query decoding' },
      { id: 'headers', repId: 'backend-header-value', label: 'headers' },
      { id: 'body', repId: 'backend-read-json-body', label: 'JSON body' },
      { id: 'path', repId: 'backend-normalize-path', label: 'path cleaning' },
      { id: 'match', repId: 'backend-match-route', label: 'route match' },
      { id: 'route', repId: 'backend-route-request', label: 'route choice' },
    ],
    milestones: [
      { parts: 5, does: 'requests parse' },
      { parts: 8, does: 'requests reach a handler' },
    ],
  },
]

/** The code of a rep's latest completed attempt that saved some, or null when there is none. */
export function latestCompletedCode(history: PortableRecord[], repId: string): string | null {
  let latest: PortableRecord | undefined
  for (const record of history)
    if (record.repId === repId && record.code.trim() && Number.isFinite(Date.parse(record.completedAt)))
      if (!latest || Date.parse(record.completedAt) > Date.parse(latest.completedAt)) latest = record
  return latest?.code ?? null
}

/** The ids of a reward's lit parts. */
export const litParts = (reward: StageReward, history: PortableRecord[]) =>
  new Set(reward.parts.filter(part => latestCompletedCode(history, part.repId) !== null).map(part => part.id))

export type RewardProgress = {
  reward: StageReward
  lit: number
  total: number
  /** "2 reps until requests parse.", or null once every part is lit. */
  until: string | null
  /** "3 of 8 parts lit. 2 reps until requests parse." */
  summary: string
  /** The summary after the toy's title, for places that do not name it already. */
  line: string
}

/** A reward's progress line, such as "Request console: 3 of 8 parts lit. 2 reps until requests parse." */
export function rewardProgress(reward: StageReward, history: PortableRecord[]): RewardProgress {
  const lit = litParts(reward, history)
  const total = reward.parts.length
  const reps = (count: number) => `${count} ${count === 1 ? 'rep' : 'reps'}`
  // The next milestone is the first one with an unlit part among the parts it needs.
  const next = reward.milestones
    .map(milestone => ({ ...milestone, missing: reward.parts.slice(0, milestone.parts).filter(part => !lit.has(part.id)).length }))
    .find(milestone => milestone.missing > 0)
  const until = next ? `${reps(next.missing)} until ${next.does}.` : null
  const summary = until ? `${lit.size} of ${total} parts lit. ${until}` : `All ${total} parts lit, so ${reward.milestones.at(-1)?.does}.`
  const line = `${reward.title}: ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`
  return { reward, lit: lit.size, total, until, summary, line }
}

/** The reward a trail stage feeds: one of the stage's reps is one of its parts. */
export const stageReward = (trackId: string, stageRepIds: readonly string[]) =>
  stageRewards.find(reward => reward.trackId === trackId && reward.parts.some(part => stageRepIds.includes(part.repId)))

/**
 * The part a completed attempt lights for the first time: its rep is a part, it saved code, and no earlier completed
 * attempt of the same rep did. A later completion of a lit part lights nothing new.
 */
export function newlyLitPart(history: PortableRecord[], recordId: string): { reward: StageReward; part: ToyPart } | null {
  const record = history.find(item => item.id === recordId)
  if (!record?.code.trim()) return null
  const at = Date.parse(record.completedAt)
  if (!Number.isFinite(at)) return null
  for (const reward of stageRewards) {
    const part = reward.parts.find(item => item.repId === record.repId)
    if (!part) continue
    const earlier = history.some(
      item => item.id !== record.id && item.repId === record.repId && item.code.trim() && Date.parse(item.completedAt) < at,
    )
    return earlier ? null : { reward, part }
  }
  return null
}
