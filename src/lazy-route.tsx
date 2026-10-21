import { lazy } from 'react'
import type { ComponentType } from 'react'
import { Button } from './Button'
import { PageHeader } from './Layout'

/** Lazy route page whose load failure offers a reload and keeps saved work. `className` styles the fallback like the page. */
export function lazyRoute<Props extends object>(load: () => Promise<ComponentType<Props>>, label: string, className?: string) {
  const LoadFailed = () => (
    <main className={className}>
      <PageHeader
        title={`${label} could not load`}
        description="Reload to try again. Your saved work is kept."
        actions={
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload app
          </Button>
        }
      />
    </main>
  )
  return lazy(() =>
    load()
      .then(component => ({ default: component }))
      .catch(() => ({ default: LoadFailed as ComponentType<Props> })),
  )
}
