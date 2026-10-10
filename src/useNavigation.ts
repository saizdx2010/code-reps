import { useEffect, useEffectEvent, useState } from 'react'
import { readRoute, routeHash } from './ui-navigation'
import type { Route, View } from './ui-navigation'

// Practice sessions no longer have a page; a bookmarked #/sessions opens the Journal instead.
function currentRoute(repIds: string[]): Route {
  const route = readRoute(location.hash, repIds)
  if (route.view !== 'sessions') return route
  history.replaceState(null, '', routeHash({ view: 'history' }))
  return { view: 'history' }
}

export function useNavigation(repIds: string[], onRestore: (route: Route) => void) {
  const [route, setRoute] = useState(() => currentRoute(repIds))
  const restore = useEffectEvent(onRestore)
  useEffect(() => {
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    const receive = () => {
      const next = currentRoute(repIds)
      restore(next)
      setRoute(next)
    }
    window.addEventListener('popstate', receive)
    window.addEventListener('hashchange', receive)
    return () => { history.scrollRestoration = previousRestoration; window.removeEventListener('popstate', receive); window.removeEventListener('hashchange', receive) }
  }, [repIds])
  function navigate(view: View, repId?: string) {
    const next = { view, repId }
    if (location.hash !== routeHash(next)) history.pushState(null, '', routeHash(next))
    setRoute(next)
  }
  return { route, navigate }
}
