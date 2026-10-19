import { useEffect, useState } from 'react'

type PathTextModule = typeof import('./path-text.ts')
let loaded: PathTextModule | undefined
let pending: Promise<PathTextModule> | undefined

/** Starts loading the trail's track and stage text. A failed load is tried again the next time a trail mounts. */
export function loadPathText(): Promise<PathTextModule> {
  pending ??= import('./path-text.ts').then(
    module => (loaded = module),
    error => {
      pending = undefined
      throw error
    },
  )
  return pending
}

/**
 * The trail's stage descriptions and recaps, which load just after its structure. The trail stays usable without them:
 * until they arrive, or if they cannot load, each stage shows its title, level, and progress.
 */
export function usePathText(): PathTextModule | undefined {
  const [module, setModule] = useState(loaded)
  useEffect(() => {
    if (module) return
    let current = true
    loadPathText().then(
      value => {
        if (current) setModule(value)
      },
      () => {},
    )
    return () => {
      current = false
    }
  }, [module])
  return module
}
