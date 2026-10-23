import { useEffect, useState } from 'react'

// What the trail draws just after its structure: stage text and reward lines. Neither is in the startup bundle.

/**
 * A module that loads just after the page that uses it. `use()` gives undefined until it arrives, or if it cannot load,
 * so the page stays usable without it; a failed load is tried again the next time a component mounts.
 */
function lazyModule<T>(load: () => Promise<T>) {
  let loaded: T | undefined
  let pending: Promise<T> | undefined
  return function useLazyModule(): T | undefined {
    const [module, setModule] = useState(loaded)
    useEffect(() => {
      if (module) return
      let current = true
      pending ??= load().then(
        value => (loaded = value),
        error => {
          pending = undefined
          throw error
        },
      )
      pending.then(
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
}

/**
 * The trail's stage descriptions and recaps, which load just after its structure. Until they arrive, or if they cannot
 * load, each stage shows its title, level, and progress.
 */
export const usePathText = lazyModule(() => import('./path-text.ts'))

/** The stage reward lines (src/ToyRewards.tsx), which load just after the trail; a stage shows none until they do. */
export const useStageRewards = lazyModule(() => import('./ToyRewards'))
