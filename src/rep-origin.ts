import { skillIndex } from './catalog-index.ts'
import { sectionView } from './ui-navigation.ts'
import type { View } from './ui-navigation.ts'

/**
 * Where a rep was opened from, so the workspace can lead back there and step through the same list.
 * Session-only: stored as `<rep id>:lesson:<skill id>` or `<rep id>:view:<view>`. An older value, `<rep id>:<skill id>`,
 * still reads as a lesson.
 */
export type RepOrigin = { kind: 'lesson'; skillId: string } | { kind: 'view'; view: View }

export function encodeRepOrigin(repId: string, origin: RepOrigin): string {
  return origin.kind === 'lesson' ? `${repId}:lesson:${origin.skillId}` : `${repId}:view:${origin.view}`
}

/** The origin saved for this rep; a value saved for another rep, or none, means the Library. */
export function decodeRepOrigin(value: string, repId: string): RepOrigin {
  if (!value.startsWith(`${repId}:`)) return { kind: 'view', view: 'catalog' }
  const rest = value.slice(repId.length + 1)
  if (rest.startsWith('view:')) {
    const view = rest.slice('view:'.length) as View
    return view in backLabels ? { kind: 'view', view } : { kind: 'view', view: 'catalog' }
  }
  const skillId = rest.startsWith('lesson:') ? rest.slice('lesson:'.length) : rest
  return skillIndex.some(skill => skill.id === skillId) ? { kind: 'lesson', skillId } : { kind: 'view', view: 'catalog' }
}

/** The origin a rep opened from `view` records. Opening one rep from another keeps the first rep's origin. */
export function originFrom(view: View, skillId: string | undefined, current: RepOrigin): RepOrigin {
  if (view === 'workspace') return current
  if (view === 'knowledge' && skillId) return { kind: 'lesson', skillId }
  return { kind: 'view', view: sectionView(view) in backLabels ? sectionView(view) : 'catalog' }
}

// The page a back link names, by section. Pages reached from another page fold into their section.
const backLabels: Partial<Record<View, string>> = {
  home: 'Your trail',
  paths: 'All tracks',
  catalog: 'Library',
  knowledge: 'Lessons',
  projects: 'Projects',
  progress: 'Skills',
  history: 'Journal',
}

export function backLabel(origin: RepOrigin): string {
  return origin.kind === 'lesson'
    ? (skillIndex.find(skill => skill.id === origin.skillId)?.title ?? 'Lessons')
    : (backLabels[origin.view] ?? 'Library')
}
