export type View = 'sessions' | 'home' | 'catalog' | 'workspace' | 'history' | 'learn' | 'paths' | 'progress' | 'skillmap' | 'knowledge' | 'notebook' | 'plan' | 'assessment' | 'projects' | 'interview'
export type Route = { view: View; repId?: string }
const views: View[] = ['sessions', 'home', 'catalog', 'workspace', 'history', 'learn', 'paths', 'progress', 'skillmap', 'knowledge', 'notebook', 'plan', 'assessment', 'projects', 'interview']

export const navigationSections = {
  trail: [{ view: 'home', label: 'Your trail' }, { view: 'paths', label: 'All tracks' }, { view: 'plan', label: 'This week' }],
  library: [{ view: 'catalog', label: 'Exercises' }, { view: 'knowledge', label: 'Lessons' }, { view: 'projects', label: 'Projects' }, { view: 'interview', label: 'Interview' }],
  progress: [{ view: 'progress', label: 'Skills' }, { view: 'skillmap', label: 'Skill map' }, { view: 'history', label: 'Journal' }, { view: 'assessment', label: 'Self-assessment' }],
} satisfies Record<string, { view: View; label: string }[]>

// Pages reached through another section's own switch: the Journal and quick lessons.
const sectionAliases: Partial<Record<View, View>> = { sessions: 'history', notebook: 'history', learn: 'knowledge' }
export const sectionView = (view: View): View => sectionAliases[view] ?? view

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
