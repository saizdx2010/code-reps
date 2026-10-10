export type View = 'sessions' | 'home' | 'catalog' | 'workspace' | 'history' | 'learn' | 'paths' | 'progress' | 'skillmap' | 'knowledge' | 'notebook' | 'plan' | 'assessment' | 'mistakes' | 'projects' | 'interview'
export type Route = { view: View; repId?: string }
const views: View[] = ['sessions', 'home', 'catalog', 'workspace', 'history', 'learn', 'paths', 'progress', 'skillmap', 'knowledge', 'notebook', 'plan', 'assessment', 'mistakes', 'projects', 'interview']

export const navigationSections = {
  trail: [{ view: 'home', label: 'Your trail' }, { view: 'paths', label: 'All tracks' }],
  library: [{ view: 'catalog', label: 'Exercises' }, { view: 'knowledge', label: 'Lessons' }, { view: 'projects', label: 'Projects' }],
  progress: [{ view: 'progress', label: 'Skills' }, { view: 'history', label: 'Journal' }],
} satisfies Record<string, { view: View; label: string }[]>

// Pages reached from another page rather than a tab: the Journal switch, quick lessons, the skill map (a view of Skills),
// the weekly plan and self-assessment (quiet links on Skills), and timed interview practice (an opt-in inside Projects).
// Their routes still resolve, so old bookmarks keep working.
const sectionAliases: Partial<Record<View, View>> = { sessions: 'history', notebook: 'history', mistakes: 'history', learn: 'knowledge', skillmap: 'progress', plan: 'progress', assessment: 'progress', interview: 'projects' }
export const sectionView = (view: View): View => sectionAliases[view] ?? view

/** Moves to a page from a component that does not own navigation state; the hash change updates the route. */
export function goToView(view: View) { location.hash = routeHash({ view }) }

export function navigationArea(view: View): keyof typeof navigationSections {
  view = sectionView(view)
  if (view === 'workspace') return 'library'
  return (Object.keys(navigationSections) as (keyof typeof navigationSections)[])
    .find(area => navigationSections[area].some(item => item.view === view)) ?? 'trail'
}
export function readRoute(hash: string, repIds: string[]): Route {
  const [page, rawId] = hash.replace(/^#\/?/, '').split('/')
  if (page === 'practice' && rawId) {
    try { const repId = decodeURIComponent(rawId); if (repIds.includes(repId)) return { view: 'workspace', repId } } catch { /* Invalid bookmark returns to the library. */ }
    return { view: 'catalog' }
  }
  if (page === 'practice') return { view: 'catalog' }
  return { view: views.includes(page as View) && page !== 'workspace' ? page as View : 'home' }
}
export function routeHash(route: Route): string {
  return route.view === 'workspace' && route.repId ? `#/practice/${encodeURIComponent(route.repId)}` : `#/${route.view === 'catalog' ? 'practice' : route.view}`
}
