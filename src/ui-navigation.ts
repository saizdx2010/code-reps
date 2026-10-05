export type View = 'home' | 'catalog' | 'workspace' | 'history' | 'learn' | 'paths' | 'progress' | 'knowledge' | 'notebook' | 'plan' | 'assessment' | 'projects' | 'interview'
export type Route = { view: View; repId?: string }
const views: View[] = ['home', 'catalog', 'workspace', 'history', 'learn', 'paths', 'progress', 'knowledge', 'notebook', 'plan', 'assessment', 'projects', 'interview']

export const navigationSections = {
  home: [{ view: 'home', label: 'Today' }, { view: 'plan', label: 'Practice plan' }],
  practice: [{ view: 'catalog', label: 'Exercises' }, { view: 'projects', label: 'Projects' }, { view: 'interview', label: 'Interview' }],
  learn: [{ view: 'knowledge', label: 'Lessons' }, { view: 'paths', label: 'Paths' }, { view: 'notebook', label: 'Notebook' }],
  progress: [{ view: 'progress', label: 'Skills' }, { view: 'history', label: 'History' }, { view: 'assessment', label: 'Self-assessment' }],
} satisfies Record<string, { view: View; label: string }[]>

export function navigationArea(view: View): keyof typeof navigationSections {
  if (view === 'workspace') return 'practice'
  if (view === 'learn') return 'learn'
  return (Object.keys(navigationSections) as (keyof typeof navigationSections)[])
    .find(area => navigationSections[area].some(item => item.view === view)) ?? 'home'
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
