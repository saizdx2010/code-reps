import { skillIndex } from './catalog-index.ts'

const views = [
  'sessions',
  'home',
  'catalog',
  'workspace',
  'history',
  'learn',
  'paths',
  'progress',
  'skillmap',
  'knowledge',
  'notebook',
  'plan',
  'assessment',
  'mistakes',
  'stuck',
  'patterns',
  'projects',
  'interview',
  'finished',
  'first-weeks',
  'request-console',
] as const
export type View = (typeof views)[number]
// A lesson has its own address, #/knowledge/<skill-id>, so it can be bookmarked and Back returns to it; so does a
// finished track, #/finished/<path-id>.
export type Route = { view: View; repId?: string; skillId?: string; pathId?: string }
const skillIds = new Set(skillIndex.map(skill => skill.id))

export const navigationSections = {
  trail: [
    { view: 'home', label: 'Your trail' },
    { view: 'paths', label: 'All tracks' },
  ],
  library: [
    { view: 'catalog', label: 'Exercises' },
    { view: 'knowledge', label: 'Lessons' },
    { view: 'projects', label: 'Projects' },
  ],
  progress: [
    { view: 'progress', label: 'Skills' },
    { view: 'history', label: 'Journal' },
  ],
} satisfies Record<string, { view: View; label: string }[]>

// Pages reached from another page rather than a tab: the Journal switch, quick lessons, the skill map (a view of Skills),
// the weekly plan, self-assessment, first four weeks, and finished tracks (reached from Skills), timed interview
// practice (an opt-in inside Projects), and the Request console (a toy listed in Projects and linked from Backend trail
// stages). Their routes still resolve, so old bookmarks keep working.
const sectionAliases: Partial<Record<View, View>> = {
  sessions: 'history',
  notebook: 'history',
  mistakes: 'history',
  stuck: 'history',
  learn: 'knowledge',
  patterns: 'knowledge',
  skillmap: 'progress',
  plan: 'progress',
  assessment: 'progress',
  finished: 'progress',
  'first-weeks': 'progress',
  interview: 'projects',
  'request-console': 'projects',
}
export const sectionView = (view: View): View => sectionAliases[view] ?? view

/** Moves to a page from a component that does not own navigation state; the hash change updates the route. */
export function goToView(view: View, pathId?: string) {
  location.hash = routeHash({ view, pathId })
}

/** Session key naming the project that Library → Projects opens and scrolls to once, after a trail link. */
export const openProjectKey = 'code-reps:ui:projects:open'

/** Opens Library → Projects with one external project expanded, such as the DevOps project at the end of its trail. */
export function openExternalProject(projectId: string) {
  try {
    sessionStorage.setItem(openProjectKey, projectId)
  } catch {
    /* Without session storage the page still opens; the learner expands the project. */
  }
  goToView('projects')
}

export function navigationArea(view: View): keyof typeof navigationSections {
  view = sectionView(view)
  if (view === 'workspace') return 'library'
  return (
    (Object.keys(navigationSections) as (keyof typeof navigationSections)[]).find(area =>
      navigationSections[area].some(item => item.view === view),
    ) ?? 'trail'
  )
}
export function readRoute(hash: string, repIds: string[]): Route {
  const [page, rawId] = hash.replace(/^#\/?/, '').split('/')
  if (page === 'practice' && rawId) {
    try {
      const repId = decodeURIComponent(rawId)
      if (repIds.includes(repId)) return { view: 'workspace', repId }
    } catch {
      /* Invalid bookmark returns to the library. */
    }
    return { view: 'catalog' }
  }
  if (page === 'practice') return { view: 'catalog' }
  if (page === 'knowledge' && rawId) {
    try {
      const skillId = decodeURIComponent(rawId)
      if (skillIds.has(skillId)) return { view: 'knowledge', skillId }
    } catch {
      /* An invalid lesson link opens the lessons page. */
    }
    return { view: 'knowledge' }
  }
  // A finished track's page needs a track; without one, the Skills page lists the finished tracks. The page itself says
  // when a track id is unknown.
  if (page === 'finished') return rawId ? { view: 'finished', pathId: rawId } : { view: 'progress' }
  return { view: views.includes(page as View) && page !== 'workspace' ? (page as View) : 'home' }
}
export function routeHash(route: Route): string {
  if (route.view === 'workspace' && route.repId) return `#/practice/${encodeURIComponent(route.repId)}`
  if (route.view === 'knowledge' && route.skillId) return `#/knowledge/${encodeURIComponent(route.skillId)}`
  if (route.view === 'finished' && route.pathId) return `#/finished/${route.pathId}`
  return `#/${route.view === 'catalog' ? 'practice' : route.view}`
}
