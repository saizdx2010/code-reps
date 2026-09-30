export type View = 'home' | 'catalog' | 'workspace' | 'history' | 'learn' | 'paths' | 'progress'
export type Route = { view: View; repId?: string }
const views: View[] = ['home', 'catalog', 'workspace', 'history', 'learn', 'paths', 'progress']
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
