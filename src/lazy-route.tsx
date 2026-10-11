import { lazy } from 'react'
import type { ComponentType } from 'react'

/** Lazy route page whose load failure offers a reload and keeps saved work. */
export function lazyRoute<Props extends object>(load: () => Promise<ComponentType<Props>>, label: string) {
  return lazy(() => load().then(component => ({ default: component })).catch(() => ({ default: (() => <main><h1>{label} could not load</h1><p>Reload to try again. Your saved work is kept.</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload app</button></main>) as ComponentType<Props> })))
}
